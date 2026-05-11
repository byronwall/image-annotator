import { AbsoluteCenterDemo } from "./absolute-center";
import { AccordionDemo } from "./accordion";
import { AlertDemo } from "./alert";
import { AvatarDemo } from "./avatar";
import { BadgeDemo } from "./badge";
import { BreadcrumbDemo } from "./breadcrumb";
import { ButtonDemo } from "./button";
import { CardDemo } from "./card";
import { CarouselDemo } from "./carousel";
import { CheckboxDemo } from "./checkbox";
import { ClipboardDemo } from "./clipboard";
import { CloseButtonDemo } from "./close-button";
import { CodeDemo } from "./code";
import { CollapsibleDemo } from "./collapsible";
import { ComboboxDemo } from "./combobox";
import { ColorPickerDemo } from "./color-picker";
import { DatePickerDemo } from "./date-picker";
import { DisplayValueDemo } from "./display-value";
import { DialogDemo } from "./dialog";
import { DrawerDemo } from "./drawer";
import { EditableDemo } from "./editable";
import { FieldDemo } from "./field";
import { FieldsetDemo } from "./fieldset";
import { FileUploadDemo } from "./file-upload";
import { GroupDemo } from "./group";
import { HeadingDemo } from "./heading";
import { HoverCardDemo } from "./hover-card";
import { IconDemo } from "./icon";
import { IconButtonDemo } from "./icon-button";
import { InputAddonDemo } from "./input-addon";
import { InputDemo } from "./input";
import { InputGroupDemo } from "./input-group";
import { KbdDemo } from "./kbd";
import { LinkDemo } from "./link";
import { MenuDemo } from "./menu";
import { NumberInputDemo } from "./number-input";
import { PaginationDemo } from "./pagination";
import { PinInputDemo } from "./pin-input";
import { PopoverDemo } from "./popover";
import { ProgressDemo } from "./progress";
import { RadioCardGroupDemo } from "./radio-card-group";
import { RadioGroupDemo } from "./radio-group";
import { RatingGroupDemo } from "./rating-group";
import { ScrollAreaDemo } from "./scroll-area";
import { SegmentGroupDemo } from "./segment-group";
import { SelectDemo } from "./select";
import { SkeletonDemo } from "./skeleton";
import { SliderDemo } from "./slider";
import { SimpleDialogDemo } from "./simple-dialog";
import { SimplePopoverDemo } from "./simple-popover";
import { SimpleSelectDemo } from "./simple-select";
import { SpinnerDemo } from "./spinner";
import { SplitterDemo } from "./splitter";
import { SwitchRecipeDemo } from "./switch";
import { TableDemo } from "./table";
import { TabsDemo } from "./tabs";
import { TagsInputDemo } from "./tags-input";
import { TextDemo } from "./text";
import { TextareaDemo } from "./textarea";
import { ToastDemo } from "./toast";
import { ToggleGroupDemo } from "./toggle-group";
import { TooltipDemo } from "./tooltip";

import type { Component } from "solid-js";
import { Dynamic } from "solid-js/web";

export interface DemoComponentProps {
  variantProps?: Record<string, string>;
}

export const DEMO_COMPONENTS: Partial<
  Record<string, Component<DemoComponentProps>>
> = {
  absoluteCenter: AbsoluteCenterDemo,
  accordion: AccordionDemo,
  alert: AlertDemo,
  avatar: AvatarDemo,
  badge: BadgeDemo,
  breadcrumb: BreadcrumbDemo,
  button: ButtonDemo,
  card: CardDemo,
  carousel: CarouselDemo,
  checkbox: CheckboxDemo,
  clipboard: ClipboardDemo,
  closeButton: CloseButtonDemo,
  code: CodeDemo,
  collapsible: CollapsibleDemo,
  colorPicker: ColorPickerDemo,
  combobox: ComboboxDemo,
  datePicker: DatePickerDemo,
  displayValue: DisplayValueDemo,
  dialog: DialogDemo,
  drawer: DrawerDemo,
  editable: EditableDemo,
  field: FieldDemo,
  fieldset: FieldsetDemo,
  fileUpload: FileUploadDemo,
  group: GroupDemo,
  heading: HeadingDemo,
  hoverCard: HoverCardDemo,
  icon: IconDemo,
  iconButton: IconButtonDemo,
  inputAddon: InputAddonDemo,
  input: InputDemo,
  inputGroup: InputGroupDemo,
  kbd: KbdDemo,
  link: LinkDemo,
  menu: MenuDemo,
  numberInput: NumberInputDemo,
  pagination: PaginationDemo,
  pinInput: PinInputDemo,
  popover: PopoverDemo,
  progress: ProgressDemo,
  radioCardGroup: RadioCardGroupDemo,
  radioGroup: RadioGroupDemo,
  ratingGroup: RatingGroupDemo,
  scrollArea: ScrollAreaDemo,
  segmentGroup: SegmentGroupDemo,
  select: SelectDemo,
  skeleton: SkeletonDemo,
  slider: SliderDemo,
  simpleDialog: SimpleDialogDemo,
  simplePopover: SimplePopoverDemo,
  simpleSelect: SimpleSelectDemo,
  spinner: SpinnerDemo,
  splitter: SplitterDemo,
  switch: SwitchRecipeDemo,
  switchRecipe: SwitchRecipeDemo,
  table: TableDemo,
  tabs: TabsDemo,
  tagsInput: TagsInputDemo,
  text: TextDemo,
  textarea: TextareaDemo,
  toast: ToastDemo,
  toggleGroup: ToggleGroupDemo,
  tooltip: TooltipDemo,
};

type RenderDemoComponentProps = DemoComponentProps & {
  demoKey: string;
};

export const RenderDemoComponent = (props: RenderDemoComponentProps) => (
  <Dynamic component={DEMO_COMPONENTS[props.demoKey]} variantProps={props.variantProps} />
);
