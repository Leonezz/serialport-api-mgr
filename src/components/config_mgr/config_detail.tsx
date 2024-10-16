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
import { Fragment, ReactNode, useState } from "react";
import DeleteConfirmPopover from "../basics/delete-confirm-popover";
import { ChevronsLeftRight, ChevronsRightLeft } from "lucide-react";
import { SupportedConfig, UseStoreHandles } from "./util";
import { UsedByTable } from "./used_by_tbl";
import { DEFAULT_DATETIME_FORMAT } from "@/util/datetime";
import { StyledTitle } from "../basics/styled_title";

type ConfigDetailCommonProps<Key extends keyof SupportedConfig> = {
  configFor: Key;
  value: SupportedConfig[Key]["namedConfigType"];
  onValueChange: (
    value: Partial<
      Omit<BasicConfigInfomation, "id" | "createAt" | "updateAt" | "usedBy">
    >
  ) => void;
  readonly: boolean;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const ConfigDetailCommon = <Key extends keyof SupportedConfig>({
  configFor,
  value,
  onValueChange,
  children,
  readonly,
  onValueSave,
  onValueDelete,
}: ConfigDetailCommonProps<Key> &
  Readonly<{
    children: ReactNode;
  }>) => {
  // type NamedConfigType = SupportedConfig[Key]["namedConfigType"];
  const [collapsedCommon, setCollapsedCommon] = useState(false);
  const [collapsedDetail, setCollapsedDetail] = useState(false);

  const { update: updateConfig, delete: deleteConfig } =
    UseStoreHandles[configFor]();

  return (
    <div className="flex flex-row gap-2 w-full">
      <Card className={`w-${collapsedDetail ? "fit" : "full"}`}>
        <CardHeader
          className={`flex flex-row justify-${
            collapsedDetail ? "around" : "between"
          }`}
        >
          {!collapsedDetail && (
            <StyledTitle size="large" color={readonly ? "default" : "primary"}>
              Detailed Config
            </StyledTitle>
          )}
          <Button
            size="sm"
            variant="light"
            color="primary"
            isIconOnly
            onClick={() => setCollapsedDetail((prev) => !prev)}
          >
            {collapsedDetail ? <ChevronsLeftRight /> : <ChevronsRightLeft />}
          </Button>
        </CardHeader>
        <CardBody
          className={`flex flex-col gap-4 w-full scrollbar-hide ${
            collapsedDetail ? "hidden" : ""
          }`}
        >
          {children}
        </CardBody>
      </Card>
      <Card className={`w-${collapsedCommon ? "fit" : "full"}`}>
        <CardHeader
          className={`flex flex-row justify-${
            collapsedCommon ? "around" : "between"
          }`}
        >
          {!collapsedCommon && (
            <StyledTitle size="large">Common Config</StyledTitle>
          )}
          <Button
            size="sm"
            variant="light"
            color="primary"
            isIconOnly
            onClick={() => setCollapsedCommon((prev) => !prev)}
          >
            {collapsedCommon ? <ChevronsLeftRight /> : <ChevronsRightLeft />}
          </Button>
        </CardHeader>
        <CardBody
          className={`flex flex-col gap-4 w-full scrollbar-hide ${
            collapsedCommon ? "hidden" : ""
          }`}
        >
          <Snippet symbol="ID: " size="sm" codeString={value.id}>
            {value.id}
          </Snippet>
          <Snippet
            symbol="Create at: "
            size="sm"
            codeString={value.createAt.toFormat(DEFAULT_DATETIME_FORMAT)}
          >
            {value.createAt.toFormat(DEFAULT_DATETIME_FORMAT)}
          </Snippet>
          <Snippet
            symbol="Update at: "
            size="sm"
            codeString={value.updateAt.toFormat(DEFAULT_DATETIME_FORMAT)}
          >
            {value.updateAt.toFormat(DEFAULT_DATETIME_FORMAT)}
          </Snippet>
          <Input
            isReadOnly={readonly}
            label={
              <StyledTitle color={readonly ? "default" : "primary"}>
                Config Name
              </StyledTitle>
            }
            size="sm"
            labelPlacement="outside"
            type="text"
            value={value.name}
            onValueChange={(v) => {
              // setConfigValue((prev) => prev && { ...prev, name: v });
              onValueChange({ name: v });
            }}
          />
          <Textarea
            label={<StyledTitle>Comment</StyledTitle>}
            size="sm"
            labelPlacement="outside"
            value={value.comment}
            onValueChange={(v) => {
              // setConfigValue((prev) => prev && { ...prev, comment: v });
              onValueChange({ comment: v });
            }}
          />
          <UsedByTable usedByList={value.usedBy} />
        </CardBody>
        <CardFooter
          className={`justify-end ${collapsedCommon ? "hidden" : ""}`}
        >
          {value ? (
            <Fragment>
              <DeleteConfirmPopover
                content={
                  <Fragment>
                    <p className=" text-medium font-semibold">
                      Are you sure to delete config: {value.name}
                    </p>
                    <p>id: {value.id}</p>
                  </Fragment>
                }
                onConfirm={() => {
                  deleteConfig({ id: value.id });
                  onValueDelete();
                }}
              />
              <Button
                color="primary"
                variant="light"
                onClick={() => {
                  updateConfig({
                    id: value.id,
                    basicInfo: { ...value },
                    config: { ...value.config },
                  });
                  onValueSave();
                }}
              >
                Save
              </Button>
            </Fragment>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfigDetailCommon;
