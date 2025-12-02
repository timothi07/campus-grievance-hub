import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { VoiceInput } from "@/components/shared/VoiceInput";

const complaintSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(150),
  category_id: z.string().min(1, "Please select a category"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(1000),
  priority: z.enum(["low", "medium", "high"]),
  attachment: z.instanceof(File).optional()
    .refine(file => !file || file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
    .refine(
      file => !file || ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(file.type),
      "Only images (JPEG, PNG) and PDFs are allowed"
    ),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintFormProps {
  onSuccess?: () => void;
}

const ComplaintForm = ({ onSuccess }: ComplaintFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, departments(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      category_id: "",
      description: "",
      priority: "medium",
    },
  });

  const createComplaint = useMutation({
    mutationFn: async (data: ComplaintFormData) => {
      let attachmentUrl = null;

      if (data.attachment) {
        const fileExt = data.attachment.name.split(".").pop();
        const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("complaint-attachments")
          .upload(fileName, data.attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("complaint-attachments")
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
      }

      const category = categories?.find(c => c.id === parseInt(data.category_id));
      
      const { error } = await supabase
        .from("complaints")
        .insert({
          user_id: user!.id,
          title: data.title,
          description: data.description,
          category_id: parseInt(data.category_id),
          department_id: category?.department_id,
          priority: data.priority,
          attachment_url: attachmentUrl,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast({
        title: "Success",
        description: "Your complaint has been submitted successfully.",
      });
      form.reset();
      setSelectedFile(null);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("attachment", file);
    }
  };

  const onSubmit = (data: ComplaintFormData) => {
    createComplaint.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Complaint</CardTitle>
        <CardDescription>Fill in the details to submit your complaint</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                placeholder="Brief summary of your complaint"
                {...form.register("title")}
                className="flex-1"
              />
              <VoiceInput onTranscript={(text) => form.setValue("title", text)} />
            </div>
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => form.setValue("category_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name} ({category.departments?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category_id && (
              <p className="text-sm text-destructive">{form.formState.errors.category_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select defaultValue="medium" onValueChange={(value) => form.setValue("priority", value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="flex gap-2">
              <Textarea
                id="description"
                placeholder="Provide detailed information about your complaint"
                rows={6}
                {...form.register("description")}
                className="flex-1"
              />
              <VoiceInput 
                onTranscript={(text) => {
                  const current = form.getValues("description");
                  form.setValue("description", current ? `${current} ${text}` : text);
                }} 
              />
            </div>
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Upload className="mr-1 h-4 w-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>
            {form.formState.errors.attachment && (
              <p className="text-sm text-destructive">{form.formState.errors.attachment.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum file size: 5MB. Allowed formats: JPEG, PNG, PDF
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={createComplaint.isPending}>
            {createComplaint.isPending ? "Submitting..." : "Submit Complaint"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
