import { Card, CardContent } from '@repo/ui/components/card';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const [response, setResponse] = useState(null);

  const login = () => {
  };

  return (
    <div id="root" className="p-2">
      <Card>
        <CardContent>TEST</CardContent>
      </Card>
    </div>
  );
}
