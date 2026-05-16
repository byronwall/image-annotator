import type { SolidMarkdownComponents } from "solid-markdown";
import { css } from "styled-system/css";

const styles = {
  tableWrapper: css({
    width: "full",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    mb: 4,
  }),
  table: css({
    width: "max-content",
    minWidth: "full",
    borderCollapse: "collapse",
    borderWidth: "1px",
    borderColor: "border.default",
    borderRadius: "md",
    overflow: "hidden",
  }),
};

export const markdownTableComponents = {
  table: (tableProps) => (
    <div class={styles.tableWrapper}>
      <table class={styles.table} {...tableProps} />
    </div>
  ),
  hr: (hrProps) => (
    <hr
      class={css({
        borderColor: "border.subtle",
        my: 4,
      })}
      {...hrProps}
    />
  ),
  thead: (theadProps) => (
    <thead
      class={css({
        bg: "bg.subtle",
        borderBottomWidth: "2px",
        borderBottomColor: "border.default",
      })}
      {...theadProps}
    />
  ),
  tbody: (tbodyProps) => <tbody {...tbodyProps} />,
  tr: (trProps) => (
    <tr
      class={css({
        borderBottomWidth: "1px",
        borderBottomColor: "border.default",
        _even: {
          bg: "bg.muted",
        },
      })}
      {...trProps}
    />
  ),
  th: (thProps) => {
    // TODO:AS_ANY - solid-markdown passes props with incompatible ref types
    const { _isHeader, ...restProps } = thProps as any;
    return (
      <th
        class={css({
          px: 4,
          py: 3,
          textAlign: "left",
          fontWeight: "semibold",
          fontSize: "sm",
        })}
        {...restProps}
      />
    );
  },
  td: (tdProps) => {
    // TODO:AS_ANY - solid-markdown passes props with incompatible ref types
    const { _isHeader, ...restProps } = tdProps as any;
    return (
      <td
        class={css({
          px: 4,
          py: 3,
          fontSize: "sm",
        })}
        {...restProps}
      />
    );
  },
} satisfies SolidMarkdownComponents;
