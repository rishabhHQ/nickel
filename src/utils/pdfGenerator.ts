import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateGoalSummaryPDF = (goalData: any) => {
    const doc = new jsPDF();
    const { auto_saving, transactions, delay_history, ...goal } = goalData;
    const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
    const progressCapped = Math.min(progress, 100).toFixed(1);

    // --- PDF Styling & Config ---
    const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo-500
    const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
    const lightText: [number, number, number] = [107, 114, 128]; // Gray-500
    let yPos = 20;

    // Helper: Add Text
    const addText = (text: string, x: number, y: number, size: number, color: [number, number, number], isBold = false, align = 'left') => {
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        if (align === 'center') {
            doc.text(text, x, y, { align: "center" });
        } else {
            doc.text(text, x, y);
        }
    };

    // --- Header ---
    addText("NICKEL", 105, yPos, 24, primaryColor, true, "center");
    yPos += 10;
    
    addText("Financial Goal Summary", 105, yPos, 14, textColor, false, "center");
    yPos += 12;

    // Horizontal Line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    // --- Section 1: Goal Overview ---
    addText("SECTION 1 - GOAL OVERVIEW", 14, yPos, 12, primaryColor, true);
    yPos += 8;
    addText(`Goal Name:`, 14, yPos, 10, lightText);
    addText(goal.name, 50, yPos, 10, textColor, true);
    yPos += 6;
    addText(`Status:`, 14, yPos, 10, lightText);
    addText(goal.status, 50, yPos, 10, textColor, true);
    yPos += 6;
    addText(`Target Date:`, 14, yPos, 10, lightText);
    addText(new Date(goal.current_completion_date).toLocaleDateString(), 50, yPos, 10, textColor, true);
    yPos += 6;
    addText(`Progress:`, 14, yPos, 10, lightText);
    addText(`${progressCapped}%`, 50, yPos, 10, textColor, true);
    yPos += 12;

    // Horizontal Line
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    // --- Section 2: Financial Summary ---
    addText("SECTION 2 - FINANCIAL SUMMARY", 14, yPos, 12, primaryColor, true);
    yPos += 8;
    addText(`Target Amount:`, 14, yPos, 10, lightText);
    addText(`Rs. ${goal.target_amount.toLocaleString('en-IN')}`, 50, yPos, 10, textColor, true);
    yPos += 6;
    addText(`Total Saved:`, 14, yPos, 10, lightText);
    addText(`Rs. ${goal.saved_amount.toLocaleString('en-IN')}`, 50, yPos, 10, textColor, true);
    yPos += 6;
    addText(`Remaining:`, 14, yPos, 10, lightText);
    addText(`Rs. ${(goal.target_amount - goal.saved_amount).toLocaleString('en-IN')}`, 50, yPos, 10, textColor, true);
    yPos += 12;

    // Horizontal Line
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    // --- Section 3: Saving Plan ---
    addText("SECTION 3 - SAVING PLAN", 14, yPos, 12, primaryColor, true);
    yPos += 8;
    if (auto_saving) {
        addText(`Frequency:`, 14, yPos, 10, lightText);
        addText(auto_saving.frequency, 50, yPos, 10, textColor, true);
        yPos += 6;
        addText(`AutoPay Amount:`, 14, yPos, 10, lightText);
        addText(`Rs. ${auto_saving.amount.toLocaleString('en-IN')}`, 50, yPos, 10, textColor, true);
        yPos += 6;
        addText(`Next Deduction:`, 14, yPos, 10, lightText);
        addText(new Date(auto_saving.next_run_date).toLocaleDateString(), 50, yPos, 10, textColor, true);
        yPos += 6;
    } else {
        addText("No auto-saving configured.", 14, yPos, 10, lightText);
        yPos += 6;
    }
    yPos += 6;

    // Horizontal Line
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    // --- Section 4: Progress Visualization ---
    addText("SECTION 4 - PROGRESS", 14, yPos, 12, primaryColor, true);
    yPos += 8;
    // Draw simple progress bar
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(243, 244, 246); // bg-gray-100
    doc.roundedRect(14, yPos, 182, 8, 4, 4, 'FD');
    
    if (progress > 0) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        const barWidth = Math.min(182 * (progress / 100), 182);
        doc.roundedRect(14, yPos, barWidth, 8, 4, 4, 'F');
    }
    yPos += 16;

    // Horizontal Line
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    // --- Section 5: Transaction History ---
    addText("SECTION 5 - RECENT TRANSACTIONS", 14, yPos, 12, primaryColor, true);
    yPos += 8;

    const tableData = transactions.slice(0, 50).map((t: any) => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.description || (t.type === 'CREDIT' ? 'Deposit' : 'Withdrawal'),
        `${t.type === 'CREDIT' ? '+' : '-'}Rs. ${t.amount.toLocaleString('en-IN')}`,
        t.status
    ]);

    if (tableData.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Type', 'Description', 'Amount', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
        addText("No transactions found.", 14, yPos, 10, lightText);
        yPos += 10;
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
    }
    
    // Horizontal Line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    addText("Report Generated: " + new Date().toLocaleString(), 14, yPos, 8, lightText);
    yPos += 5;
    addText("Generated by Nickel - Financial Goal Management Platform", 14, yPos, 8, lightText);

    // Save PDF
    const safeFilename = `Nickel_Goal_Summary_${goal.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(safeFilename);
};
