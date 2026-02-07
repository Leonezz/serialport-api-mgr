import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Button, Input, Modal } from "./ui";

const SimpleInputFormSchema = z.object({
  value: z.string().min(1, "Required"),
});

type SimpleInputFormData = z.infer<typeof SimpleInputFormSchema>;

interface Props {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const SimpleInputModal: React.FC<Props> = ({
  title,
  defaultValue = "",
  placeholder,
  onSave,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SimpleInputFormData>({
    resolver: zodResolver(SimpleInputFormSchema),
    defaultValues: { value: defaultValue },
  });

  const onSubmit = (data: SimpleInputFormData): void => {
    onSave(data.value.trim());
    onClose();
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form="simple-input-form">
        <Check className="w-4 h-4 mr-2" /> Save
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <form id="simple-input-form" onSubmit={handleSubmit(onSubmit)}>
        <Input {...register("value")} placeholder={placeholder} autoFocus />
        {errors.value && (
          <p className="text-xs text-destructive mt-1">
            {errors.value.message}
          </p>
        )}
      </form>
    </Modal>
  );
};

export default SimpleInputModal;
