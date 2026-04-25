import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Clock, DollarSign, Users, AlertCircle } from "lucide-react";

interface LibraryRulesDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const LibraryRulesDialog: React.FC<LibraryRulesDialogProps> = ({
  open,
  onAccept,
  onDecline,
}) => {
  const [accepted, setAccepted] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-library-600" />
            Library Rules & Regulations
          </DialogTitle>
          <DialogDescription>
            Please read and accept the following terms before registering
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-library-600" />
                Borrowing Limits
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Students can borrow up to <strong>3 books</strong> at a time</li>
                <li>Faculty members can borrow up to <strong>5 books</strong> at a time</li>
                <li>External users can borrow up to <strong>2 books</strong> at a time</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-library-600" />
                Loan Duration
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Standard loan period: <strong>14 days</strong></li>
                <li>Renewals allowed: <strong>Up to 2 times</strong> (30 days each)</li>
                <li>Reference books: <strong>Library use only</strong></li>
                <li>Reserved books: <strong>7 days</strong> loan period</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-library-600" />
                Fines & Penalties
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Overdue fine: <strong>Rs. 1 per day</strong> per book</li>
                <li>Lost book: <strong>Full replacement cost</strong> + processing fee</li>
                <li>Damaged book: <strong>Repair cost</strong> or replacement</li>
                <li>Maximum fine cap: <strong>Rs. 500</strong> per book</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-library-600" />
                General Rules
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Library cards are <strong>non-transferable</strong></li>
                <li>Maintain <strong>silence</strong> in reading areas</li>
                <li>Mobile phones must be on <strong>silent mode</strong></li>
                <li>Food and beverages are <strong>not allowed</strong></li>
                <li>Return books in <strong>good condition</strong></li>
                <li>Report damaged or lost books <strong>immediately</strong></li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-library-600" />
                Consequences of Violation
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Suspension of borrowing privileges</li>
                <li>Restriction from library facilities</li>
                <li>Academic holds on student records</li>
                <li>Legal action for theft or vandalism</li>
              </ul>
            </section>

            <section className="bg-library-50 p-4 rounded-md border border-library-200">
              <p className="text-xs text-slate-600 italic">
                By accepting these terms, you agree to abide by all library rules and regulations.
                The library reserves the right to modify these rules at any time. Continued use
                of library services constitutes acceptance of any changes.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
          />
          <label
            htmlFor="accept"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and accept the library rules and regulations
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button
            onClick={onAccept}
            disabled={!accepted}
            className="bg-library-600 hover:bg-library-700"
          >
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const LibraryRulesContent = () => (
  <div className="space-y-6 text-sm max-w-4xl">
    <section>
      <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-library-600" />
        Borrowing Limits
      </h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-600">
        <li>Students: 3 books | Faculty: 5 books | External: 2 books</li>
      </ul>
    </section>

    <section>
      <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
        <Clock className="h-4 w-4 text-library-600" />
        Loan Duration
      </h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-600">
        <li>Standard: 14 days | Renewals: 2x (30 days each) | Reference: Library only</li>
      </ul>
    </section>

    <section>
      <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-library-600" />
        Fines
      </h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-600">
        <li>Overdue: Rs. 1/day | Lost: Full cost | Max: Rs. 500/book</li>
      </ul>
    </section>
  </div>
);
