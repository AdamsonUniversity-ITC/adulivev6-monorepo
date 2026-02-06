import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { JSX } from "react";

export const ApplicationSheet = (): JSX.Element => {
    return (
      <>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Document" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="diploma">Diploma</SelectItem>
              <SelectItem value="tor">Transcript of Records</SelectItem>
              <SelectItem value="good_moral">Good Moral</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </>
    );
};