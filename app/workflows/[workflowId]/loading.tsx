import { LoaderCircleIcon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
      <LoaderCircleIcon className="animate-spin size-10 mx-auto" />
    </div>
  );
}
