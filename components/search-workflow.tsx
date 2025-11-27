"use client";
import Form from "next/form";
import { Input } from "./ui/input";

export function SearchWorkflow() {
  return (
    <Form action="/">
      <Input
        type="text"
        name="query"
        placeholder="Search workflows..."
        className="w-80 bg-white"
      />
    </Form>
  );
}
