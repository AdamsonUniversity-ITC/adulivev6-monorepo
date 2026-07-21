export type AllowedFileTypeOption = {
  id: string;
  label: string;
  mimeTypes: string[];
};

export const ALLOWED_FILE_TYPE_OPTIONS: AllowedFileTypeOption[] = [
  {
    id: 'pdf',
    label: 'PDF',
    mimeTypes: ['application/pdf'],
  },
  {
    id: 'word',
    label: 'Word (.doc / .docx)',
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  {
    id: 'excel',
    label: 'Excel (.xls / .xlsx)',
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  {
    id: 'powerpoint',
    label: 'PowerPoint (.ppt / .pptx)',
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  {
    id: 'jpeg',
    label: 'JPEG',
    mimeTypes: ['image/jpeg'],
  },
  {
    id: 'png',
    label: 'PNG',
    mimeTypes: ['image/png'],
  },
  {
    id: 'webp',
    label: 'WebP',
    mimeTypes: ['image/webp'],
  },
  {
    id: 'gif',
    label: 'GIF',
    mimeTypes: ['image/gif'],
  },
];

const KNOWN_MIME_TYPES = new Set(
  ALLOWED_FILE_TYPE_OPTIONS.flatMap((option) => option.mimeTypes),
);

export function mimeTypesForOptionIds(optionIds: string[]): string[] {
  const selected = new Set(optionIds);
  const mimeTypes: string[] = [];
  for (const option of ALLOWED_FILE_TYPE_OPTIONS) {
    if (!selected.has(option.id)) continue;
    for (const mime of option.mimeTypes) {
      if (!mimeTypes.includes(mime)) {
        mimeTypes.push(mime);
      }
    }
  }
  return mimeTypes;
}

export function selectedOptionIdsFromMimes(mimeTypes: string[]): string[] {
  const selected = new Set(mimeTypes);
  return ALLOWED_FILE_TYPE_OPTIONS.filter((option) =>
    option.mimeTypes.some((mime) => selected.has(mime)),
  ).map((option) => option.id);
}

export function unknownMimeTypes(mimeTypes: string[]): string[] {
  return mimeTypes.filter((mime) => !KNOWN_MIME_TYPES.has(mime));
}

export function toggleMimeOption(
  currentMimeTypes: string[],
  optionId: string,
  checked: boolean,
): string[] {
  const option = ALLOWED_FILE_TYPE_OPTIONS.find((row) => row.id === optionId);
  if (!option) {
    return currentMimeTypes;
  }

  const unknown = unknownMimeTypes(currentMimeTypes);
  const selectedIds = new Set(selectedOptionIdsFromMimes(currentMimeTypes));

  if (checked) {
    selectedIds.add(optionId);
  } else {
    selectedIds.delete(optionId);
  }

  return [...mimeTypesForOptionIds([...selectedIds]), ...unknown];
}
