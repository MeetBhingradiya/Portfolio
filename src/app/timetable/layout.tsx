import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'University Timetables - Meet Bhingradiya',
    description: 'Dynamic university timetable management system with multiple schedules and publish dates',
    keywords: ['timetable', 'university', 'schedule', 'academic', 'calendar'],
};

export default function TimetableLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
