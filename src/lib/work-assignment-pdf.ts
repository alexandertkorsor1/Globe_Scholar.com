import jsPDF from 'jspdf';
import { WorkAssignment } from '../types/database';

const DEPARTMENT_LABELS: Record<string, string> = {
  admin: 'Administration',
  marketing: 'Marketing',
  admissions: 'Admissions',
  counseling: 'Counseling',
  data_applications: 'Data & Applications',
  operations: 'Operations',
  finance: 'Finance',
  country_directors: 'Country Directors',
  it_support: 'IT Support',
  legal_compliance: 'Legal & Compliance',
  alumni_success: 'Alumni Success',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URGENT',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'Not Specified';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Generates and downloads a PDF of the Work Assignment (Assigning Period)
 */
export const downloadAssignmentPdf = (assignment: WorkAssignment) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Dark blue banner header
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 42, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GLOBE SCHOLARS PATHWAYS, LLC.', 20, 18);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('Official Cross-Department Operations Directive', 20, 27);

  // Assignment badge
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WORK DIRECTIVE / TASK ASSIGNMENT', 20, 56);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  let y = 68;

  const addRow = (label: string, value: string, highlightVal: boolean = false) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(label, 20, y);

    pdf.setFont('helvetica', highlightVal ? 'bold' : 'normal');
    if (highlightVal) {
      pdf.setTextColor(79, 70, 229); // indigo-600
    } else {
      pdf.setTextColor(15, 23, 42); // slate-900
    }
    pdf.text(value || 'N/A', 75, y);

    y += 10;
  };

  addRow('Assignment No:', assignment.assignment_number, true);
  addRow('Directive Title:', assignment.title);
  addRow('Dispatched By:', assignment.creator_name || 'Operations');
  addRow('Assigned Department:', DEPARTMENT_LABELS[assignment.assigned_department] || assignment.assigned_department);
  addRow('Priority Level:', PRIORITY_LABELS[assignment.priority] || 'MEDIUM');
  addRow('Issued Date:', formatDate(assignment.created_at));
  addRow('Due Date:', formatDate(assignment.due_date));
  addRow('Current Status:', assignment.status.toUpperCase());

  y += 5;

  // Description box
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.roundedRect(20, y, pageWidth - 40, 50, 3, 3, 'FD');

  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('INSTRUCTIONS / DESCRIPTION OF WORK REQUIRED:', 26, y + 10);

  pdf.setTextColor(30, 41, 59); // slate-800
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  // Multi-line description splitting
  const descText = assignment.description || 'No detailed instructions provided.';
  const splitDesc = pdf.splitTextToSize(descText, pageWidth - 52);
  pdf.text(splitDesc, 26, y + 18);

  y += 65;

  // Authorization footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('Document digitally generated and authenticated via GSP Portal.', 20, y);
  pdf.text(`Document Reference: ${assignment.id}`, 20, y + 5);

  pdf.save(`${assignment.assignment_number}-Assignment.pdf`);
};

/**
 * Generates and downloads a PDF of the Work Submission (Submission Period)
 */
export const downloadSubmissionPdf = (
  assignment: WorkAssignment,
  submissionNotes: string,
  submittedBy: string,
  submittedAt: string
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Dark green header banner (representing completion)
  pdf.setFillColor(4, 120, 87); // emerald-700
  pdf.rect(0, 0, pageWidth, 42, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GLOBE SCHOLARS PATHWAYS, LLC.', 20, 18);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(167, 243, 208); // emerald-200
  pdf.text('Official Work Submission & Completion Receipt', 20, 27);

  // Submission header
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WORK COMPLETION SUBMISSION', 20, 56);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  let y = 68;

  const addRow = (label: string, value: string, highlightVal: boolean = false) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(label, 20, y);

    pdf.setFont('helvetica', highlightVal ? 'bold' : 'normal');
    if (highlightVal) {
      pdf.setTextColor(4, 120, 87); // emerald-700
    } else {
      pdf.setTextColor(15, 23, 42); // slate-900
    }
    pdf.text(value || 'N/A', 75, y);

    y += 10;
  };

  addRow('Assignment No:', assignment.assignment_number, true);
  addRow('Directive Title:', assignment.title);
  addRow('Assigned Department:', DEPARTMENT_LABELS[assignment.assigned_department] || assignment.assigned_department);
  addRow('Completed & Submitted By:', submittedBy);
  addRow('Submission Date:', formatDate(submittedAt));
  addRow('Original Due Date:', formatDate(assignment.due_date));
  addRow('Final Task Status:', 'COMPLETED / SUBMITTED');

  y += 5;

  // Description box
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.roundedRect(20, y, pageWidth - 40, 32, 3, 3, 'FD');

  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('ORIGINAL DIRECTIVE INSTRUCTIONS:', 26, y + 8);

  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  const origDesc = assignment.description || 'No detailed instructions provided.';
  const splitOrig = pdf.splitTextToSize(origDesc, pageWidth - 52);
  pdf.text(splitOrig, 26, y + 15);

  y += 40;

  // Submission notes box
  pdf.setFillColor(240, 253, 250); // teal-50
  pdf.setDrawColor(153, 246, 228); // teal-200
  pdf.roundedRect(20, y, pageWidth - 40, 50, 3, 3, 'FD');

  pdf.setTextColor(15, 118, 110); // teal-700
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DEPARTMENT COMPLETION NOTES & RESULTS:', 26, y + 10);

  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const splitNotes = pdf.splitTextToSize(submissionNotes || 'Work completed successfully.', pageWidth - 52);
  pdf.text(splitNotes, 26, y + 18);

  y += 62;

  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('Document digitally generated and authenticated via GSP Portal.', 20, y);
  pdf.text(`Submission Reference: ${assignment.id}-SUB`, 20, y + 5);

  pdf.save(`${assignment.assignment_number}-Submission.pdf`);
};
