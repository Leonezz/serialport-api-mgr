import { Button } from "@nextui-org/react";

type AddConfigToolBarProps = {
  onClick: () => void;
};
const AddConfigToolBar = ({ onClick }: AddConfigToolBarProps) => {
  return (
    <Button size="sm" variant="light" color="primary" className="min-h-fit" onClick={onClick}>
      New Config
    </Button>
  );
};

export default AddConfigToolBar;
