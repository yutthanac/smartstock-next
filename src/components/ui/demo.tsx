import React from "react";
import { WanderingEyes } from "@/components/ui/wandering-eyes";

export default function WanderingEyesDemo() {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center">
      <WanderingEyes className="h-16 w-36 text-stone-800" />
    </div>
  );
}

export { WanderingEyesDemo };
