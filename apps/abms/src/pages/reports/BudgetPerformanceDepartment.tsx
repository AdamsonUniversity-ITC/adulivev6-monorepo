import { Card, CardContent } from "@repo/ui/components/card"
import AdamsonBudgetLayout from "../../layouts/Screenlayout"
import { Label } from "@repo/ui/components/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { Page, PageHeader, PageSurface } from "../../components/ui/Page";

const SCHOOL_YEARS = [
    '2021-2022',
    '2022-2023',
    '2023-2024',
    '2024-2025',
    '2025-2026',
];

const DEPARTMENTS = [
    'College of Engineering',
    'College of Architecture',
    'College of Business Administration',
    'College of Arts and Sciences',
    'College of Nursing and Allied Health',
    'College of Education',
    'College of Law',
    'College of Information Technology and Computer Studies',
    'Senior High School',
    'Office of Student Affairs',
    'Administrative Office',
    'Finance Office',
    'Library Services',
];

export default function BudgetPerformanceDepartment() {
    return (
        <AdamsonBudgetLayout>
            <Page width="narrow">

                        {/* Page Header */}
                        <PageHeader
                            title="Budget Performance Per Department"
                            description="Track spending, remaining balances, and budget consumption rates per department."
                        />

                        {/* Filters Card */}
                        <PageSurface>
                        <Card className="border-0 bg-transparent shadow-none">
                            <CardContent className="pt-5 pb-5">
                                <div className="flex flex-col sm:flex-row gap-5">

                                    {/* School Year */}
                                    <div className="flex flex-col gap-1.5 sm:w-48">
                                        <Label
                                            className="text-xs font-semibold text-[var(--abms-primary)]"
                                        >
                                            School Year
                                        </Label>
                                        <Select>
                                            <SelectTrigger
                                                className="border-[var(--abms-border)] bg-[var(--abms-surface)] text-[var(--abms-text)]"
                                            >
                                                <SelectValue placeholder="Select school year" />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="max-h-[calc(5*2.5rem)] overflow-y-auto"
                                            >
                                                {SCHOOL_YEARS.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Department / Section */}
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label
                                            className="text-xs font-semibold text-[var(--abms-primary)]"
                                        >
                                            Department / Section
                                        </Label>
                                        <Select>
                                            <SelectTrigger
                                                className="border-[var(--abms-border)] bg-[var(--abms-surface)] text-[var(--abms-text)]"
                                            >
                                                <SelectValue placeholder="Select department or section" />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="max-h-[calc(5*2.5rem)] overflow-y-auto"
                                            >
                                                {DEPARTMENTS.map((dept) => (
                                                    <SelectItem key={dept} value={dept}>
                                                        {dept}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                        </PageSurface>

                    </Page>
        </AdamsonBudgetLayout>
    );
}
