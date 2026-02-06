import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Plus } from 'lucide-react';

const DisplayGroupDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Add a new group to organize your documents and packages
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input id="group-name" placeholder="e.g., Financial Documents" />
          </div>
          <div className="flex justify-end gap-2">
            <Button>Create Group</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DisplayGroup = () => {
  return (
    <Card className="border-border border">
      <CardHeader>
        <CardTitle>Display Groups</CardTitle>
        <CardDescription>
          Organize documents and packages into groups for better management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-select">Select Group</Label>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="w-full" id="group-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="display_group">Display Group</SelectItem>
              </SelectContent>
            </Select>
            <DisplayGroupDialog />
          </div>
        </div>

        <Button variant="destructive" size="sm" className="w-full">
          Delete
        </Button>
      </CardContent>
    </Card>
  );
};
