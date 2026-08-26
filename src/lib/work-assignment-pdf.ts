import jsPDF from 'jspdf';
import { WorkAssignment } from '../types/database';
import { BRAND_LOGO_BASE64 } from './brand-logo-base64';

const DEPARTMENT_LABELS: Record<string, string> = {
  admin: 'Administration',
  marketing: 'Marketing',
  admissions: 'Admissions',
  counseling: 'Counseling',
  data_applications: 'Data & Applications',
  operations: 'Operations',
  finance: 'Finance',
  country_directors: 'Country Directors',
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

export const getCreatorDepartmentKey = (creatorName?: string): string => {
  if (!creatorName) return 'operations';
  const match = creatorName.match(/\(([^)]+)\)/);
  return match ? match[1] : 'operations';
};

/**
 * Draws the official Globe Scholars Pathways, LLC letterhead on a jsPDF instance
 */
export const drawLetterhead = (
  pdf: jsPDF,
  departmentKey: string,
  seriesNumber: string
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Draw Left Logo
  try {
    pdf.addImage(BRAND_LOGO_BASE64, 'JPEG', 15, 6, 20, 20);
  } catch (err) {
    console.error('Failed to add left brand logo to letterhead:', err);
  }

  // Draw Right Logo
  try {
    pdf.addImage(BRAND_LOGO_BASE64, 'JPEG', 175, 6, 20, 20);
  } catch (err) {
    console.error('Failed to add right brand logo to letterhead:', err);
  }

  // Header Title: "GlobeScholars Pathways, LLC."
  pdf.setTextColor(10, 25, 49); // Dark blue
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('GlobeScholars Pathways, LLC.', pageWidth / 2, 12, { align: 'center' });

  // Thin grey line below the main title
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.3);
  pdf.line(40, 14, 170, 14);

  // Subtitle: "Educational Consultants"
  pdf.setTextColor(216, 122, 43); // Orange/Brown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('Educational Consultants', pageWidth / 2, 19, { align: 'center' });

  // Tagline: "Navigating Your Global Study Journey"
  pdf.setTextColor(80, 80, 80);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('Navigating Your Global Study Journey', pageWidth / 2, 23, { align: 'center' });

  // Department name (Office of the ...)
  const rawLabel = DEPARTMENT_LABELS[departmentKey] || departmentKey;
  const formattedDept = rawLabel.toUpperCase().endsWith('DEPARTMENT') 
    ? rawLabel.toUpperCase() 
    : `${rawLabel.toUpperCase()} DEPARTMENT`;
  
  pdf.setTextColor(29, 78, 216); // Blue
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text(`OFFICE OF THE ${formattedDept}`, pageWidth / 2, 28, { align: 'center' });

  // Address
  pdf.setTextColor(80, 80, 80);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text('Monrovia City, Montserrado County, Republic of Liberia - 1000 LR', pageWidth / 2, 32, { align: 'center' });

  // Contact info
  pdf.text('Email: info@globescholarspathways.com   Phone: +231-8886326999', pageWidth / 2, 36, { align: 'center' });

  // Series Number on the right side of the header area (always Red, Bold, and Italic)
  pdf.setTextColor(220, 38, 38); // Red
  pdf.setFont('helvetica', 'bolditalic');
  pdf.setFontSize(9.5);
  pdf.text(`Series No: ${seriesNumber}`, 195, 40, { align: 'right' });

  // Tri-color horizontal lines (spanning margins 15mm to 195mm)
  // Red line
  pdf.setFillColor(220, 38, 38);
  pdf.rect(15, 42, 180, 0.6, 'F');
  // Yellow line
  pdf.setFillColor(245, 158, 11);
  pdf.rect(15, 42.7, 180, 0.6, 'F');
  // Blue line
  pdf.setFillColor(29, 78, 216);
  pdf.rect(15, 43.4, 180, 0.6, 'F');
};

/**
 * Generates and downloads a PDF of the Work Assignment (Assigning Period)
 */
export const downloadAssignmentPdf = (
  assignment: WorkAssignment,
  allAssignments?: WorkAssignment[]
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  const creatorDept = getCreatorDepartmentKey(assignment.creator_name);

  // Compute Series Number
  let seriesStr = '001';
  if (allAssignments && allAssignments.length > 0) {
    const deptAssignments = allAssignments
      .filter((a) => getCreatorDepartmentKey(a.creator_name) === creatorDept)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const index = deptAssignments.findIndex((a) => a.id === assignment.id);
    if (index !== -1) {
      seriesStr = String(index + 1).padStart(3, '0');
    }
  } else {
    const parts = assignment.assignment_number.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      seriesStr = String(parseInt(lastPart, 10)).padStart(3, '0');
    }
  }

  // Draw Letterhead
  drawLetterhead(pdf, creatorDept, seriesStr);

  // Assignment badge
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WORK DIRECTIVE / TASK ASSIGNMENT', 20, 52);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  let y = 63;

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
  submittedAt: string,
  allAssignments?: WorkAssignment[]
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  const creatorDept = getCreatorDepartmentKey(assignment.creator_name);

  // Compute Series Number
  let seriesStr = '001';
  if (allAssignments && allAssignments.length > 0) {
    const deptAssignments = allAssignments
      .filter((a) => getCreatorDepartmentKey(a.creator_name) === creatorDept)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const index = deptAssignments.findIndex((a) => a.id === assignment.id);
    if (index !== -1) {
      seriesStr = String(index + 1).padStart(3, '0');
    }
  } else {
    const parts = assignment.assignment_number.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      seriesStr = String(parseInt(lastPart, 10)).padStart(3, '0');
    }
  }

  // Draw Letterhead
  drawLetterhead(pdf, creatorDept, seriesStr);

  // Submission header
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WORK COMPLETION SUBMISSION', 20, 52);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  let y = 63;

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
