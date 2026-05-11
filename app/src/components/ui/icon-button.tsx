import { Button, type ButtonProps } from "./button";
import { Icon } from "./icon";

export interface IconButtonProps extends ButtonProps {}

export const IconButton = (props: IconButtonProps) => {
  return <Button px="0" py="0" {...props} />;
};

export interface IconButtonDemoProps {
  variantProps?: Record<string, string>;
}

export const IconButtonDemo = (props: IconButtonDemoProps) => {
  return (
    <IconButton aria-label="Add to favorites" {...(props.variantProps ?? {})}>
      <Icon viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m12 3 2.9 5.88 6.5.95-4.7 4.57 1.1 6.47L12 18.73 6.2 20.87l1.1-6.47-4.7-4.57 6.5-.95z"
        />
      </Icon>
    </IconButton>
  );
};
