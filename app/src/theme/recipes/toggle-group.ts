import { toggleGroupAnatomy } from "@ark-ui/solid/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const toggleGroup = defineSlotRecipe({
  className: "toggle-group",
  slots: toggleGroupAnatomy.keys(),
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
    },
    item: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textStyle: "sm",
      fontWeight: "medium",
      height: "10",
      px: "3.5",
      color: "fg.muted",
      userSelect: "none",
      transition: "common",
      _hover: {
        bg: "bg.muted",
      },
      "&:focus-visible": {
        zIndex: "1",
        focusVisibleRing: "inside",
      },
      "&[data-state=on], &[data-state=checked]": {
        color: "fg.default",
        bg: "bg.default",
      },
      "&:not(:first-child)": {
        borderInlineStartWidth: "1px",
      },
    },
  },
  variants: {
    variant: {
      outline: {
        root: {
          borderRadius: "l3",
          borderWidth: "1px",
          borderColor: "border",
          overflow: "hidden",
          bg: "bg.subtle",
        },
        item: {
          borderColor: "border",
        },
      },
    },
  },
});
