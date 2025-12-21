import { NextRequest, NextResponse } from 'next/server';
import TimetableModel from '../../../../../Models/Timetable';
import { connectToDatabase } from '../../../../../Lib/MongoDB';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { options } = await request.json();
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findOne({
            _id: id
        });

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        // Generate PDF
        const pdf = new jsPDF({
            orientation: options.orientation || 'landscape',
            unit: 'pt',
            format: options.format || 'a4'
        });

        const grid = timetable.generateGrid();

        // Add title
        pdf.setFontSize(16);
        pdf.text(timetable.title, 40, 40);

        // Add metadata if requested
        if (options.includeMetadata) {
            pdf.setFontSize(10);
            let yPos = 60;
            pdf.text(`Program: ${timetable.metadata.programName}`, 40, yPos);
            yPos += 15;
            pdf.text(`Semester: ${timetable.metadata.semester}`, 40, yPos);
            yPos += 15;
            pdf.text(`Batch: ${timetable.metadata.batch}`, 40, yPos);
            yPos += 15;
            pdf.text(`Academic Year: ${timetable.metadata.academicYear}`, 40, yPos);
            yPos += 15;
            pdf.text(`Published: ${new Date(timetable.metadata.publishDate).toLocaleDateString()}`, 40, yPos);
        }

        // Prepare table data
        const headers = ['Time', ...timetable.visibleDays];
        const tableData: (string | object)[][] = [];

        grid.cells.forEach((row: any, rowIndex: number) => {
            const rowData: (string | object)[] = [
                `${grid.timeSlots[rowIndex].startTime}\nto\n${grid.timeSlots[rowIndex].endTime}`
            ];

            row.forEach((cell: any) => {
                if (cell.subject) {
                    const subject = cell.subject;
                    const cellContent = {
                        content: `${subject.code}\n${subject.name}\n(${subject.type})\n${subject.room.buildingCode}${subject.room.floorNumber}${subject.room.roomNumber}`,
                        styles: {
                            fillColor: subject.type === 'Lecture' ? [230, 230, 250] :
                                subject.type === 'Lab' ? [240, 248, 255] : [245, 255, 250],
                            textColor: [0, 0, 0],
                            fontSize: 8,
                            cellPadding: 3
                        }
                    };
                    rowData.push(cellContent);
                } else if (options.includeEmptySlots) {
                    rowData.push('');
                } else {
                    rowData.push({
                        content: '',
                        styles: { fillColor: [248, 248, 248] }
                    });
                }
            });

            tableData.push(rowData);
        });

        // Add table
        autoTable(pdf, {
            head: [headers],
            body: tableData,
            startY: options.includeMetadata ? 140 : 80,
            theme: 'striped',
            styles: {
                fontSize: 8,
                cellPadding: 3,
                halign: 'center',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [70, 130, 180],
                textColor: [255, 255, 255],
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 80, halign: 'center' }
            }
        });

        // Generate PDF buffer
        const pdfBuffer = pdf.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${timetable.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 }
        );
    }
}
