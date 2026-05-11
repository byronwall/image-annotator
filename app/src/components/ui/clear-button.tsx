import { CircleXIcon } from "lucide-solid";
import { splitProps } from "solid-js";
import { IconButton, type IconButtonProps } from "./icon-button";
import { Tooltip } from "./tooltip";

export type ClearButtonProps = IconButtonProps & {
  label?: string;
};

export const ClearButton = (props: ClearButtonProps) => {
  const [local, rest] = splitProps(props, ["children", "label"]);
  const label = () => local.label ?? "Clear";

  return (
    <Tooltip content={label()} disabled={rest.disabled}>
      <IconButton
        size="xs"
        variant="plain"
        aria-label={label()}
        type="button"
        {...rest}
      >
        {local.children ?? <CircleXIcon />}
      </IconButton>
    </Tooltip>
  );
};
