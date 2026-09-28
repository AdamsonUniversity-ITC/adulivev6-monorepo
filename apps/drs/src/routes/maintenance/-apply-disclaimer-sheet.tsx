import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Label } from '@repo/ui/components/label';
import {
  RichTextEditor,
  sanitizeRichTextHtml,
} from '@repo/ui/components/rich-text-editor';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JSX, useEffect, useMemo, useState } from 'react';
import {
  fetchApplyDisclaimer,
  updateApplyDisclaimer,
} from './-lib/api/fetchApplyDisclaimer.ts';

const APPLY_DISCLAIMER_QUERY_KEY = ['apply_disclaimer'] as const;

export const ApplyDisclaimerSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [bodyHtml, setBodyHtml] = useState('');

  const query = useQuery({
    queryKey: APPLY_DISCLAIMER_QUERY_KEY,
    queryFn: fetchApplyDisclaimer,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      setBodyHtml(query.data.body_html);
    }
  }, [query.data]);

  const previewHtml = useMemo(
    () => sanitizeRichTextHtml(bodyHtml),
    [bodyHtml],
  );
  const previewVisible =
    previewHtml.replace(/<[^>]*>/g, '').trim().length > 0;

  const saveMutation = useMutation({
    mutationFn: () => updateApplyDisclaimer(bodyHtml),
    onSuccess: (data) => {
      toast.success('Apply disclaimer saved.');
      setBodyHtml(data.body_html);
      queryClient.setQueryData(APPLY_DISCLAIMER_QUERY_KEY, data);
    },
    onError: () => toast.error('Failed to save apply disclaimer.'),
  });

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Apply disclaimer
          </h2>
          <p className="text-muted-foreground text-sm">
            Shown below the Your request card on the student apply page. Leave
            empty to hide it.
          </p>
        </div>

        {query.isLoading ? (
          <DrsInlineLoading size="sm" label="Loading disclaimer…" />
        ) : query.isError ? (
          <p className="text-destructive text-sm">
            Failed to load apply disclaimer.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disclaimer content</Label>
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                showImageButton={false}
                minHeight="180px"
                placeholder="Add terms or notices students should see before submitting…"
              />
            </div>

            {previewVisible ? (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="prose prose-sm dark:prose-invert text-muted-foreground border-border max-w-none rounded-md border px-3 py-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save disclaimer'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
