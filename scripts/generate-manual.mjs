import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from 'docx';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const shots = path.join(root, 'docs/drs-screenshots');
const outFile = path.join(root, 'docs/DRS_User_Manual.docx');

function pngSize(data) {
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun(text)],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun(text)],
  });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function picture(relativePath) {
  const file = path.join(shots, relativePath);
  const data = fs.readFileSync(file);
  const size = pngSize(data);
  const width = 620;
  const height = Math.round(size.height * (width / size.width));
  return new Paragraph({
    spacing: { before: 160, after: 200 },
    children: [
      new ImageRun({
        type: 'png',
        data,
        transformation: { width, height },
        altText: { title: relativePath, description: relativePath, name: relativePath },
      }),
    ],
  });
}

function page({ title, intro, features, image }) {
  return [
    h2(title),
    body(intro),
    ...features.map(bullet),
    picture(image),
  ];
}

const children = [
  new Paragraph({
    heading: HeadingLevel.TITLE,
    children: [new TextRun('Document Request System')],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: 'User manual notes — College', italics: true, size: 24 })],
  }),
  body(
    'These notes describe each page a student, a staff member, or a configuration user can open. Use them as the source for the published user manual. Screenshots are from the College site.',
  ),
  body(
    'Sign in on the Adamson login page, then open the College Document Request System. What you see depends on the account. A student lands on My requests. A staff member who is not a configuration user lands on the queue. A configuration user lands on Configuration.',
  ),

  h1('Student'),
  body(
    'A student can open My requests and Request a document. The queue, staff request pages, and Configuration are not available and send the student back to My requests.',
  ),
  ...page({
    title: 'My requests',
    intro:
      'This is the student home page. It lists the documents the student has already requested.',
    features: [
      'Search by document, status, or reference.',
      'The table shows the reference, date submitted, current status, how the document will be received, payment state, and term.',
      'Use View to change which columns are shown. Use the pager to move between pages.',
      'Request a document starts a new request.',
      'Select a row to open that request.',
    ],
    image: 'student/my-requests.png',
  }),
  ...page({
    title: 'Request a document',
    intro:
      'Students use this page to choose what to request, how to receive it, and how to pay.',
    features: [
      'Documents and packages are grouped. Open a group, then add an item and set the quantity.',
      'Your request, on the right, shows the items, the total, and the apply disclaimer when one is configured.',
      'Contact and delivery collects the email, contact number, and whether the document is for pickup or delivery.',
      'Submit sends the request. It then appears on My requests.',
    ],
    image: 'student/apply.png',
  }),
  ...page({
    title: 'Request detail',
    intro:
      'Opening a row on My requests shows that request. The first request in the list is shown here.',
    features: [
      'The header shows the reference, status, and the student name and number.',
      'Cancel request is available only while the request can still be cancelled. Print receipt prints the request.',
      'Request, Payment, and Messages are separate tabs.',
      'The side panel shows the amount due, payment state, current stage, item count, and the date submitted.',
      'Clearances lists each department and whether it is cleared or still pending.',
      'After the request leaves the first review stage, the original details are locked. The student can still upload supporting documents, pay, or send a message.',
    ],
    image: 'student/request.png',
  }),
  body(
    'The student history address opens, but it shows this same request page. There is no separate history screen for a student.',
  ),

  h1('Staff'),
  body(
    'Staff open the queue from the navigation. A request in the queue opens the staff request page, where the assigned work is done.',
  ),
  ...page({
    title: 'Workflow queue',
    intro:
      'The queue lists requests that are on the staff member’s stages, or that previously passed through those stages.',
    features: [
      'Search by name, student number, or reference.',
      'Filter by stage, program, or flag. Watch for new requests refreshes the list.',
      'Each row shows the reference, the student, and the status. Some rows also show a flag.',
      'Select a row to open the request and complete its tasks.',
    ],
    image: 'staff/queue.png',
  }),
  ...page({
    title: 'Request processing',
    intro:
      'This is the staff view of one request. The actions on the page follow the request’s current stage.',
    features: [
      'Cancel request, History, and Print are in the header.',
      'For follow up, Checked, Pin, and Manage flags mark the request for the queue.',
      'On a clearance stage, each department can be cleared. Remarks can be saved, and Notify student by email sends a message without completing the task.',
      'Request details and requested items show what the student asked for.',
      'Messages is the thread with the student. Staff can reply and attach files.',
    ],
    image: 'staff/request.png',
  }),
  ...page({
    title: 'Request history',
    intro:
      'History is opened from the staff request. It lists saved versions of that request.',
    features: [
      'Each version shows the status at that time, when the snapshot was taken, and what changed.',
      'Rollback is available to an administrator when a version can be restored.',
      'Application returns to the request.',
    ],
    image: 'staff/request-history.png',
  }),

  h1('Configuration'),
  body(
    'Configuration is the settings home for this DRS site. Each row opens a panel. Reports and Access debugger open their own pages. Close a panel before opening the next one.',
  ),
  ...page({
    title: 'Configuration home',
    intro: 'Settings are grouped into Catalog, Workflow, Payments, People and access, and Reporting.',
    features: [
      'A row with a chevron opens a panel on top of this page.',
      'Reports and Access debugger leave this page.',
      'Only the settings this account is allowed to change are listed.',
    ],
    image: 'configuration/home.png',
  }),

  h1('Catalog'),
  ...page({
    title: 'Documents and packages',
    intro: 'This panel is the catalog of what students can request.',
    features: [
      'Pick a document group, or create, rename, or delete a group.',
      'Documents are items requested on their own. Packages are bundles of documents.',
      'Add an item, then select it to set the name, price, rules, and whether it is active.',
      'Deleting a document, package, or group removes it from the catalog. Requests already in progress keep going.',
    ],
    image: 'configuration/documents-and-packages.png',
  }),
  ...page({
    title: 'Apply disclaimer',
    intro: 'The disclaimer is the notice under Your request on the student apply page.',
    features: [
      'Write the notice in the editor. Leave it empty to hide the notice.',
      'Preview shows the notice as the student will see it.',
      'Save disclaimer stores the change.',
    ],
    image: 'configuration/apply-disclaimer.png',
  }),
  ...page({
    title: 'Request restrictions',
    intro: 'This rule controls whether a student can request the same item again.',
    features: [
      'Block re-request while unpaid stops a new request for an item while an unpaid request for that item is still open.',
      'The student can request it again after the earlier request is paid, cancelled, or disposed.',
    ],
    image: 'configuration/request-restrictions.png',
  }),

  h1('Workflow'),
  ...page({
    title: 'Stages and tasks',
    intro: 'This panel is the path a request follows, and the tasks inside each stage.',
    features: [
      'Add, reorder, edit, or remove stages. The first stage can be marked Initial.',
      'Each stage has tasks. A task can be assigned to people or to a clearance group.',
      'Transitions are the manual choices shown when a stage is completed. If none are set, the request follows the stage order.',
    ],
    image: 'configuration/stages-and-tasks.png',
  }),
  ...page({
    title: 'Paid in assessment',
    intro: 'Choose stages to skip when a request is tagged Paid in Assessment.',
    features: [
      'Tick the stages that should be skipped.',
      'The request opens on the next stage that is not ticked.',
      'Save stages stores the selection.',
    ],
    image: 'configuration/paid-in-assessment.png',
  }),
  ...page({
    title: 'Email notifications',
    intro: 'Emails sent when a request enters or leaves a stage or a task kind.',
    features: [
      'Each row is one email: the name, the stage or task, whether it fires on entry or exit, and who receives it.',
      'Add notification creates one. The pencil edits it. The trash icon deletes it.',
    ],
    image: 'configuration/email-notifications.png',
  }),
  ...page({
    title: 'Auto disposal',
    intro: 'Rules that dispose a request left too long on a stage or task.',
    features: [
      'A rule names the stage or task, how many working days to wait, and whether to warn the student first.',
      'Add rule creates one. The pencil edits it. The trash icon deletes it.',
    ],
    image: 'configuration/auto-disposal.png',
  }),
  ...page({
    title: 'Auto fetch',
    intro: 'A daily check, such as the student balance, that marks matching rows in the staff queue.',
    features: [
      'A rule names the stage or task, the data source, and whether to color the row or add a flag.',
      'Add rule creates one. The pencil edits it. The trash icon deletes it.',
    ],
    image: 'configuration/auto-fetch.png',
  }),
  ...page({
    title: 'Assessment',
    intro: 'How assessed amounts are filled in, and who may assess them.',
    features: [
      'Auto-complete price fills a price automatically when the system already knows it.',
      'Allowed employees are the only people who can act on a request during assessment.',
      'Manage in User Management opens the user list.',
    ],
    image: 'configuration/assessment.png',
  }),
  ...page({
    title: 'Clearance departments',
    intro: 'Departments that must sign off, and the people who sign for each one.',
    features: [
      'Add a department, or select one to edit its name and description.',
      'Restrict assigned staff to their course programs limits a department to the staff member’s programs.',
      'Department users are the people who can clear that department.',
    ],
    image: 'configuration/clearance-departments.png',
  }),
  ...page({
    title: 'Processing',
    intro: 'Employees and roles who process an approved request.',
    features: [
      'The roster lists who can complete processing tasks in the queue.',
      'Manage in User Management changes the roster. Import roster brings in a list.',
    ],
    image: 'configuration/processing.png',
  }),
  ...page({
    title: 'Release',
    intro: 'Employees and roles who release a completed document.',
    features: [
      'The roster lists who can complete release tasks in the queue.',
      'Manage in User Management changes the roster. Import roster brings in a list.',
    ],
    image: 'configuration/release.png',
  }),
  ...page({
    title: 'Delivery dispatch',
    intro: 'Employees and roles who send a document out for delivery.',
    features: [
      'The roster lists who can complete delivery tasks in the queue.',
      'Manage in User Management changes the roster. Import roster brings in a list.',
    ],
    image: 'configuration/delivery-dispatch.png',
  }),
  ...page({
    title: 'Pickup handoff',
    intro: 'Employees and roles who hand a document to the student for pickup.',
    features: [
      'The roster lists who can complete pickup tasks in the queue.',
      'Manage in User Management changes the roster. Import roster brings in a list.',
    ],
    image: 'configuration/pickup-handoff.png',
  }),

  h1('Payments'),
  ...page({
    title: 'Payment collection',
    intro: 'The payment choices and extra fees shown when a student applies.',
    features: [
      'Payment methods are the choices on the apply page, such as cashier or online payment. The description can hold a service fee or payment instructions.',
      'Other fees are extra charges for this site. Default account code is used for assessment other payments unless a fee overrides it.',
    ],
    image: 'configuration/payment-collection.png',
  }),
  ...page({
    title: 'Payment verification',
    intro: 'Cashiers who may check a student’s proof of payment.',
    features: [
      'The roster lists who can complete payment verification in the queue.',
      'Manage in User Management changes the roster.',
    ],
    image: 'configuration/payment-verification.png',
  }),

  h1('People and access'),
  ...page({
    title: 'Users and roles',
    intro: 'The people who work in DRS, and what each person is allowed to do.',
    features: [
      'Search by name, employee number, or email.',
      'Select a user to set roles, permissions, workflow ownership, and assignment history.',
    ],
    image: 'configuration/users-and-roles.png',
  }),
  ...page({
    title: 'Access debugger',
    intro:
      'Use this page when a staff member cannot see a request in the queue or on the request page.',
    features: [
      'Search for the staff member by name, email, or employee number.',
      'A request reference is optional. Leave it blank to explain queue access in general.',
      'Run diagnosis explains what that person can and cannot see.',
    ],
    image: 'configuration/access-debugger.png',
  }),

  h1('Reporting'),
  ...page({
    title: 'Reports',
    intro: 'Counts of requests, how long they take, and payment totals for the selected period.',
    features: [
      'Set the date range, school year, semester, course, and release mode. Paid only and Include cancelled are optional.',
      'Apply filters runs the report. Reset clears them.',
      'Now, Workload, Programs, and Register are the report groups. Status, Clearances, and Payment are the sections inside a group.',
      'Email Excel sends the file to the signed-in user’s Adamson mail. Download PDF saves a copy on this page.',
    ],
    image: 'configuration/reports.png',
  }),
  ...page({
    title: 'Report viewers',
    intro: 'Employees, other than host administrators, who may open Reports on this site.',
    features: [
      'Host administrators can always open reports.',
      'Search for an employee and add them. The list below shows who else can open the page.',
    ],
    image: 'configuration/report-viewers.png',
  }),
];

const doc = new Document({
  title: 'Document Request System user manual',
  description: 'Page-by-page notes for the College Document Request System.',
  styles: {
    default: {
      document: {
        styles: [
          {
            id: 'Normal',
            run: { font: 'Calibri', size: 22 },
          },
        ],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outFile, buffer);
console.log(`Wrote ${outFile} (${buffer.length} bytes)`);
