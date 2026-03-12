import { SendForm } from "@/components/SendForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SendPage() {
  return (
    <div className="space-y-4">
      <Link href="/">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>
      <h2 className="text-lg font-bold">Send</h2>
      <SendForm />
    </div>
  );
}
