<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Passport\Passport;
use Modules\Abms\Models\BudgetRequisitionEntry;
use Modules\Abms\Models\BudgetRequisitionEntryItem;
use Modules\Abms\Services\PermissionAccessService;
use Tests\TestCase;

class ItemRequestedPerAccountPreviewTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('app.timezone', 'Asia/Manila');
        config()->set('database.connections.db116_adamson', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
        DB::purge('db116_adamson');
        config()->set('database.connections.aduollms', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
        DB::purge('aduollms');

        $this->createTables();
        $this->seedDirectoryAndAccounts();
        $this->seedRequestedItems();
        $this->actingAsReportUser(['budget-access']);
    }

    public function test_loader_and_summary_return_request_time_totals_by_account_and_typed_unit(): void
    {
        $this->getJson('/api/abms/item-requested-per-account')
            ->assertOk()
            ->assertJsonPath('school_years.0', '2026-2027')
            ->assertJsonFragment(['account_code' => '900-1', 'account_name' => 'OPERATING CHILD'])
            ->assertJsonFragment(['type' => 'department', 'id' => 100, 'name' => 'Budget Department', 'active' => true])
            ->assertJsonFragment(['type' => 'section', 'id' => 200, 'name' => 'Budget Section', 'active' => true]);

        $response = $this->getJson($this->previewUrl());

        $response->assertOk()
            ->assertJsonPath('report.preview_type', 'summary')
            ->assertJsonPath('report.all_accounts', true)
            ->assertJsonPath('report.main_account', null)
            ->assertJsonPath('report.all_units', true)
            ->assertJsonPath('report.unit', null)
            ->assertJsonPath('report.printed_by', 'Request Middle Tester')
            ->assertJsonCount(2, 'main_account_groups')
            ->assertJsonPath('main_account_groups.0.main_account.account_code', '355')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.sub_account.account_code', '355-1')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.rows.0.unit.type', 'section')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.rows.0.total_amount', '15.00')
            ->assertJsonPath('main_account_groups.0.totals.total_amount', '15.00')
            ->assertJsonPath('main_account_groups.1.main_account.account_code', '900')
            ->assertJsonPath('main_account_groups.1.sub_account_groups.0.rows.0.unit.type', 'department')
            ->assertJsonPath('main_account_groups.1.sub_account_groups.0.rows.0.total_amount', '20.00')
            ->assertJsonPath('main_account_groups.1.totals.total_amount', '20.00')
            ->assertJsonPath('grand_total.total_amount', '35.00')
            ->assertJsonPath('data_quality.complete', true)
            ->assertJsonCount(0, 'data_quality.warnings');
    }

    public function test_detailed_uses_the_item_snapshot_at_the_first_request_timestamp(): void
    {
        $response = $this->getJson($this->previewUrl([
            'preview_type' => 'detailed',
            'all_accounts' => 0,
            'main_account_id' => 1,
            'all_units' => 0,
            'unit_type' => 'department',
            'unit_id' => 100,
        ]));

        $response->assertOk()
            ->assertJsonPath('report.main_account.id', 1)
            ->assertJsonPath('report.unit.type', 'department')
            ->assertJsonCount(1, 'main_account_groups')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.id', 20)
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.requisition_date', '2026-07-10')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.requisition_number', 'RS-001')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.description', 'OLD DESCRIPTION')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.unit_cost', '10.00')
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.quantity', 2)
            ->assertJsonPath('main_account_groups.0.sub_account_groups.0.unit_groups.0.items.0.amount', '20.00')
            ->assertJsonCount(1, 'main_account_groups.0.sub_account_groups.0.unit_groups.0.items')
            ->assertJsonPath('grand_total.total_amount', '20.00');

        $this->getJson($this->previewUrl(['from' => '2026-07-10', 'to' => '2026-07-10']))
            ->assertOk()->assertJsonPath('grand_total.total_amount', '20.00');
        $this->getJson($this->previewUrl(['from' => '2026-06-01', 'to' => '2026-07-09']))
            ->assertOk()->assertJsonPath('grand_total.total_amount', '0.00');
    }

    public function test_current_status_and_soft_delete_rules_exclude_ineligible_headers_and_items(): void
    {
        $this->getJson($this->previewUrl())
            ->assertOk()
            ->assertJsonPath('grand_total.total_amount', '35.00');
    }

    public function test_typed_unit_filters_do_not_confuse_equal_numeric_ids(): void
    {
        DB::connection('db116_adamson')->table('section')->insert([
            'cid' => 100,
            'department_id' => 100,
            'sec_name' => 'Collision Section',
            'isactive' => 1,
        ]);
        $this->insertHeader(17, null, 100, 'RS-017', 'served', '2026-06-01 00:00:00');
        $this->insertItem(27, 17, 2, '900-1', 'COLLISION ITEM', 7, 1, 7, '2026-07-01 00:00:00');
        $this->requestAudit(17, '2026-07-13 09:00:00', '0', 'RS-017');
        $this->itemCreationAudit(27, '2026-07-01 00:00:00', 2, '900-1', 'COLLISION ITEM', 7, 1, 7);

        $department = $this->getJson($this->previewUrl([
            'all_accounts' => 0,
            'main_account_id' => 1,
            'all_units' => 0,
            'unit_type' => 'department',
            'unit_id' => 100,
        ]));
        $department->assertOk()->assertJsonPath('grand_total.total_amount', '20.00');

        $section = $this->getJson($this->previewUrl([
            'all_accounts' => 0,
            'main_account_id' => 1,
            'all_units' => 0,
            'unit_type' => 'section',
            'unit_id' => 100,
        ]));
        $section->assertOk()
            ->assertJsonPath('report.unit.name', 'Collision Section')
            ->assertJsonPath('grand_total.total_amount', '7.00');
    }

    public function test_missing_request_audit_falls_back_to_created_at_with_a_structured_warning(): void
    {
        $this->insertHeader(18, 100, null, 'RS-FALLBACK', 'served', '2026-07-20 10:00:00');
        $this->insertItem(28, 18, 2, '900-1', 'FALLBACK ITEM', 6, 1, 6, '2026-07-20 10:00:00');
        $this->itemCreationAudit(28, '2026-07-20 10:00:00', 2, '900-1', 'FALLBACK ITEM', 6, 1, 6);

        $response = $this->getJson($this->previewUrl());
        $response->assertOk()
            ->assertJsonPath('grand_total.total_amount', '41.00')
            ->assertJsonPath('data_quality.complete', false)
            ->assertJsonFragment([
                'code' => 'missing_request_audit',
                'affected_count' => 1,
                'entity_ids' => [18],
            ]);
    }

    public function test_preview_validates_account_unit_date_and_preview_filters(): void
    {
        $this->getJson($this->previewUrl([
            'all_accounts' => 0,
            'main_account_id' => null,
            'from' => '2026-07-31',
            'to' => '2026-07-01',
            'preview_type' => 'unsupported',
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['main_account_id', 'to', 'preview_type']);

        $this->getJson($this->previewUrl(['all_accounts' => 1, 'main_account_id' => 1]))
            ->assertUnprocessable()->assertJsonValidationErrors(['all_accounts']);
        $this->getJson($this->previewUrl(['all_accounts' => 0, 'main_account_id' => 2]))
            ->assertUnprocessable()->assertJsonValidationErrors(['main_account_id']);
        $this->getJson($this->previewUrl(['all_accounts' => 0, 'main_account_id' => 1, 'sub_account_id' => 4]))
            ->assertUnprocessable()->assertJsonValidationErrors(['sub_account_id']);
        $this->getJson($this->previewUrl(['all_units' => 0, 'unit_type' => null, 'unit_id' => null]))
            ->assertUnprocessable()->assertJsonValidationErrors(['unit_type', 'unit_id']);
        $this->getJson($this->previewUrl(['all_units' => 1, 'unit_type' => 'department', 'unit_id' => 100]))
            ->assertUnprocessable()->assertJsonValidationErrors(['all_units']);
        $this->getJson($this->previewUrl(['all_units' => 0, 'unit_type' => 'section', 'unit_id' => 999]))
            ->assertUnprocessable()->assertJsonValidationErrors(['unit_id']);
    }

    public function test_loader_and_preview_require_budget_or_administration_access(): void
    {
        $this->actingAsReportUser([]);

        $this->getJson('/api/abms/item-requested-per-account')->assertForbidden();
        $this->getJson($this->previewUrl())->assertForbidden();
    }

    private function previewUrl(array $overrides = []): string
    {
        return '/api/abms/item-requested-per-account/preview?'.http_build_query(array_merge([
            'school_year' => '2026-2027',
            'all_accounts' => 1,
            'all_units' => 1,
            'from' => '2026-07-01',
            'to' => '2026-07-31',
            'preview_type' => 'summary',
        ], $overrides));
    }

    private function createTables(): void
    {
        $directory = Schema::connection('db116_adamson');
        foreach (['section', 'department'] as $table) {
            $directory->dropIfExists($table);
        }
        $directory->create('department', function (Blueprint $table): void {
            $table->unsignedBigInteger('cid')->primary();
            $table->string('dep_name');
            $table->unsignedTinyInteger('isactive')->default(1);
        });
        $directory->create('section', function (Blueprint $table): void {
            $table->unsignedBigInteger('cid')->primary();
            $table->unsignedBigInteger('department_id');
            $table->string('sec_name');
            $table->unsignedTinyInteger('isactive')->default(1);
        });

        Schema::connection('aduollms')->create('teachers', function (Blueprint $table): void {
            $table->id();
            $table->string('emp_no')->unique();
            $table->string('fname')->nullable();
            $table->string('mname')->nullable();
            $table->string('lname')->nullable();
        });

        foreach (['audits', 'budget_request_entry_items', 'budget_request_entry', 'accounts'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::create('accounts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('account_code');
            $table->string('account_name');
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('budget_request_entry', function (Blueprint $table): void {
            $table->id();
            $table->string('requisition_number')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable();
            $table->string('status')->nullable();
            $table->string('school_year');
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('budget_request_entry_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('budget_request_entry_id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->string('account_code')->nullable();
            $table->string('description')->nullable();
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('audits', function (Blueprint $table): void {
            $table->id();
            $table->string('event');
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');
            $table->text('old_values')->nullable();
            $table->text('new_values')->nullable();
            $table->timestamps();
        });
    }

    private function seedDirectoryAndAccounts(): void
    {
        DB::connection('db116_adamson')->table('department')->insert([
            ['cid' => 100, 'dep_name' => 'Budget Department', 'isactive' => 1],
            ['cid' => 101, 'dep_name' => 'Other Department', 'isactive' => 1],
        ]);
        DB::connection('db116_adamson')->table('section')->insert([
            'cid' => 200,
            'department_id' => 100,
            'sec_name' => 'Budget Section',
            'isactive' => 1,
        ]);
        DB::connection('aduollms')->table('teachers')->insert([
            'emp_no' => 'request.tester',
            'fname' => 'Request',
            'mname' => 'Middle',
            'lname' => 'Tester',
        ]);
        DB::table('accounts')->insert([
            ['id' => 1, 'parent_id' => null, 'account_code' => '900', 'account_name' => 'OPERATING EXPENSE', 'created_at' => '2026-06-01', 'updated_at' => '2026-06-01'],
            ['id' => 2, 'parent_id' => 1, 'account_code' => '900-1', 'account_name' => 'OPERATING CHILD', 'created_at' => '2026-06-01', 'updated_at' => '2026-06-01'],
            ['id' => 3, 'parent_id' => null, 'account_code' => '355', 'account_name' => 'CAPITAL EXPENDITURES', 'created_at' => '2026-06-01', 'updated_at' => '2026-06-01'],
            ['id' => 4, 'parent_id' => 3, 'account_code' => '355-1', 'account_name' => 'CAPEX CHILD', 'created_at' => '2026-06-01', 'updated_at' => '2026-06-01'],
        ]);
    }

    private function seedRequestedItems(): void
    {
        $this->insertHeader(10, 100, null, 'RS-001', 'served', '2026-06-01 00:00:00');
        $this->insertHeader(11, null, 200, 'RS-002', 'for review', '2026-06-01 00:00:00');
        $this->insertHeader(12, 100, null, 'RS-CANCELLED', 'cancelled', '2026-06-01 00:00:00');
        $this->insertHeader(13, 100, null, 'RS-DISAPPROVED', 'disapproved', '2026-06-01 00:00:00');
        $this->insertHeader(14, 100, null, 'RS-OTHER-YEAR', 'served', '2026-06-01 00:00:00', '2025-2026');
        $this->insertHeader(15, 100, null, '0', 'for review', '2026-06-01 00:00:00');
        $this->insertHeader(16, 100, null, 'RS-DELETED', 'served', '2026-06-01 00:00:00', '2026-2027', '2026-07-20 00:00:00');

        $this->insertItem(20, 10, 4, '355-1', 'NEW DESCRIPTION', 30, 3, 90, '2026-07-05 00:00:00');
        $this->insertItem(21, 10, 2, '900-1', 'ADDED AFTER REQUEST', 5, 1, 5, '2026-07-11 00:00:00');
        $this->insertItem(22, 11, 4, '355-1', 'CAPEX REQUEST', 5, 3, 15, '2026-07-01 00:00:00');
        $this->insertItem(23, 12, 2, '900-1', 'CANCELLED REQUEST', 99, 1, 99, '2026-07-01 00:00:00');
        $this->insertItem(24, 13, 2, '900-1', 'DISAPPROVED REQUEST', 88, 1, 88, '2026-07-01 00:00:00');
        $this->insertItem(25, 16, 2, '900-1', 'DELETED HEADER', 77, 1, 77, '2026-07-01 00:00:00');
        $this->insertItem(26, 10, 2, '900-1', 'DELETED ITEM', 66, 1, 66, '2026-07-01 00:00:00', '2026-07-20 00:00:00');

        $this->requestAudit(10, '2026-07-10 09:00:00', '0', 'RS-001');
        $this->requestAudit(10, '2026-07-25 09:00:00', 'RS-001', 'RS-001-EDITED');
        $this->requestAudit(11, '2026-07-12 09:00:00', '0', 'RS-002');
        $this->requestAudit(12, '2026-07-13 09:00:00', '0', 'RS-CANCELLED');
        $this->requestAudit(13, '2026-07-14 09:00:00', '0', 'RS-DISAPPROVED');
        $this->requestAudit(14, '2026-07-15 09:00:00', '0', 'RS-OTHER-YEAR');
        $this->requestAudit(16, '2026-07-16 09:00:00', '0', 'RS-DELETED');

        $this->itemCreationAudit(20, '2026-07-05 00:00:00', 2, '900-1', 'OLD DESCRIPTION', 10, 2, 20);
        $this->audit(BudgetRequisitionEntryItem::class, 20, 'updated', '2026-07-15 00:00:00', [
            'account_id' => 2, 'account_code' => '900-1', 'description' => 'OLD DESCRIPTION', 'unit_cost' => '10.00', 'quantity' => 2, 'total_cost' => '20.00',
        ], [
            'account_id' => 4, 'account_code' => '355-1', 'description' => 'NEW DESCRIPTION', 'unit_cost' => '30.00', 'quantity' => 3, 'total_cost' => '90.00',
        ]);
        $this->itemCreationAudit(21, '2026-07-11 00:00:00', 2, '900-1', 'ADDED AFTER REQUEST', 5, 1, 5);
        $this->itemCreationAudit(22, '2026-07-01 00:00:00', 4, '355-1', 'CAPEX REQUEST', 5, 3, 15);
    }

    private function insertHeader(int $id, ?int $departmentId, ?int $sectionId, string $number, string $status, string $createdAt, string $schoolYear = '2026-2027', ?string $deletedAt = null): void
    {
        DB::table('budget_request_entry')->insert([
            'id' => $id,
            'requisition_number' => $number,
            'department_id' => $departmentId,
            'section_id' => $sectionId,
            'status' => $status,
            'school_year' => $schoolYear,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
            'deleted_at' => $deletedAt,
        ]);
    }

    private function insertItem(int $id, int $headerId, int $accountId, string $accountCode, string $description, float $unitCost, int $quantity, float $totalCost, string $createdAt, ?string $deletedAt = null): void
    {
        DB::table('budget_request_entry_items')->insert([
            'id' => $id,
            'budget_request_entry_id' => $headerId,
            'account_id' => $accountId,
            'account_code' => $accountCode,
            'description' => $description,
            'unit_cost' => $unitCost,
            'quantity' => $quantity,
            'total_cost' => $totalCost,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
            'deleted_at' => $deletedAt,
        ]);
    }

    private function requestAudit(int $id, string $createdAt, string $oldNumber, string $newNumber): void
    {
        $this->audit(BudgetRequisitionEntry::class, $id, 'updated', $createdAt, ['requisition_number' => $oldNumber], ['requisition_number' => $newNumber]);
    }

    private function itemCreationAudit(int $id, string $createdAt, int $accountId, string $accountCode, string $description, float $unitCost, int $quantity, float $totalCost): void
    {
        $this->audit(BudgetRequisitionEntryItem::class, $id, 'created', $createdAt, [], [
            'account_id' => $accountId,
            'account_code' => $accountCode,
            'description' => $description,
            'unit_cost' => number_format($unitCost, 2, '.', ''),
            'quantity' => $quantity,
            'total_cost' => number_format($totalCost, 2, '.', ''),
        ]);
    }

    private function audit(string $modelClass, int $id, string $event, string $createdAt, array $old, array $new): void
    {
        DB::table('audits')->insert([
            'event' => $event,
            'auditable_type' => (new $modelClass)->getMorphClass(),
            'auditable_id' => $id,
            'old_values' => json_encode($old),
            'new_values' => json_encode($new),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function actingAsReportUser(array $permissions): void
    {
        $user = new User;
        $user->forceFill(['id' => 1, 'username' => 'request.tester']);
        Passport::actingAs($user);
        $this->app->instance(PermissionAccessService::class, new class($permissions) extends PermissionAccessService
        {
            public function __construct(private readonly array $permissions) {}

            public function userHasGeneralPermission(string $userId, string $permissionName): bool
            {
                return in_array($permissionName, $this->permissions, true);
            }
        });
    }
}
