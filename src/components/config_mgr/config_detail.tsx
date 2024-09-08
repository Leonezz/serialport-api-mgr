import { BasicConfigInfomation } from "@/hooks/store/buildNamedConfigStore";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Snippet,
  Textarea,
} from "@nextui-org/react";
import { Fragment, ReactNode } from "react";
import DeleteConfirmPopover from "../basics/delete-confirm-popover";

type ConfigDetailCommonProps = {
  value: BasicConfigInfomation;
  onValueChange: (
    value: Partial<
      Omit<BasicConfigInfomation, "id" | "createAt" | "updateAt" | "usedBy">
    >
  ) => void;
  readonly: boolean;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const ConfigDetailCommon = ({
  value,
  onValueChange,
  children,
  readonly,
  onValueSave,
  onValueDelete,
}: ConfigDetailCommonProps & Readonly<{ children: ReactNode }>) => {
  return (
    <div className="flex flex-row gap-2 w-full">
      <Card className="w-full">
        <CardHeader className="text-large font-extrabold">
          Device Config
        </CardHeader>
        <CardBody className=" scrollbar-hide">{children}</CardBody>
      </Card>
      <Card className="w-full">
        <CardHeader className="text-large font-extrabold">
          Common Information
        </CardHeader>
        <CardBody className="flex flex-col gap-4 w-full scrollbar-hide">
          <Snippet symbol="ID: " size="sm" codeString={value.id}>
            {value.id}
          </Snippet>
          <Snippet
            symbol="Create at: "
            size="sm"
            codeString={value.createAt.toLocaleString()}
          >
            {value.createAt.toLocaleString()}
          </Snippet>
          <Snippet
            symbol="Update at: "
            size="sm"
            codeString={value.updateAt.toLocaleString()}
          >
            {value.updateAt.toLocaleString()}
          </Snippet>
          //TODO - add used by
          <Input
            isReadOnly={readonly}
            label={
              <p className="text-medium font-bold text-content1-foreground">
                Config Name
              </p>
            }
            size="sm"
            labelPlacement="outside"
            type="text"
            value={value.name}
            onValueChange={(v) => onValueChange({ name: v })}
          />
          <Textarea
            label={
              <p className="text-medium font-bold text-content1-foreground">
                Comment
              </p>
            }
            size="sm"
            labelPlacement="outside"
            value={value.comment}
            onValueChange={(v) => onValueChange({ comment: v })}
          />
        </CardBody>
        <CardFooter className="justify-end">
          <DeleteConfirmPopover
            content={
              <Fragment>
                <p className=" text-medium font-semibold">
                  Are you sure to delete config: {value.name}
                </p>
                <p>id: {value.id}</p>
              </Fragment>
            }
            onConfirm={onValueDelete}
          />
          <Button color="primary" variant="light" onClick={onValueSave}>
            Save
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfigDetailCommon;
