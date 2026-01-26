import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@repo/ui/components/button';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div id="root" className="p-2">
      <Button>zxc</Button>
      <h3>Welcome Home!</h3>
    </div>
  );
}
