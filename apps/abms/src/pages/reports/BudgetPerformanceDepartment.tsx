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

const T = {
    dark: {
        titleColor: '#f1f5f9',
        subColor: '#94a3b8',
        cardBg: 'rgba(11, 20, 38, 0.70)',
        cardBorder: 'rgba(59, 130, 246, 0.18)',
        cardShadow: '0 4px 32px rgba(37, 99, 235, 0.10)',
        footerBg: 'rgba(8, 14, 26, 0.60)',
        footerBorder: 'rgba(59, 130, 246, 0.12)',
        labelColor: '#22d3ee',
        inputBg: 'rgba(15, 23, 42, 0.90)',
        inputBorder: 'rgba(59, 130, 246, 0.22)',
        inputText: '#e2e8f0',
        inputPlaceholder: '#475569',
        cancelColor: '#94a3b8',
        cancelHover: '#e2e8f0',
    },
    light: {
        titleColor: '#00082E',
        subColor: '#2C4A72',
        cardBg: 'rgba(240, 247, 255, 0.96)',
        cardBorder: 'rgba(59, 130, 246, 0.26)',
        cardShadow: '0 4px 32px rgba(0, 48, 135, 0.16)',
        footerBg: 'rgba(210, 228, 255, 0.70)',
        footerBorder: 'rgba(59, 130, 246, 0.22)',
        labelColor: '#1740C0',
        inputBg: '#ffffff',
        inputBorder: 'rgba(59, 130, 246, 0.32)',
        inputText: '#00082E',
        inputPlaceholder: '#5272A0',
        cancelColor: '#2C4A72',
        cancelHover: '#00082E',
    },
};

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
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                return (
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* Page Header */}
                        <div>
                            <h1
                                className="text-2xl font-bold tracking-tight"
                                style={{ color: t.titleColor }}
                            >
                                Budget Performance Per Department
                            </h1>
                            <p
                                className="text-sm mt-0.5"
                                style={{ color: t.subColor }}
                            >
                                Track spending, remaining balances, and budget consumption rates per department.
                            </p>
                        </div>

                        {/* Filters Card */}
                        <Card
                            style={{
                                background: t.cardBg,
                                border: `1px solid ${t.cardBorder}`,
                                boxShadow: t.cardShadow,
                            }}
                        >
                            <CardContent className="pt-5 pb-5">
                                <div className="flex flex-col sm:flex-row gap-5">

                                    {/* School Year */}
                                    <div className="flex flex-col gap-1.5 sm:w-48">
                                        <Label
                                            className="text-xs font-semibold"
                                            style={{ color: t.labelColor }}
                                        >
                                            School Year
                                        </Label>
                                        <Select>
                                            <SelectTrigger
                                                style={{
                                                    background: t.inputBg,
                                                    border: `1px solid ${t.inputBorder}`,
                                                    color: t.inputText,
                                                }}
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
                                            className="text-xs font-semibold"
                                            style={{ color: t.labelColor }}
                                        >
                                            Department / Section
                                        </Label>
                                        <Select>
                                            <SelectTrigger
                                                style={{
                                                    background: t.inputBg,
                                                    border: `1px solid ${t.inputBorder}`,
                                                    color: t.inputText,
                                                }}
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

                    </div>
                );
            }}
        </AdamsonBudgetLayout>
    );
}