import PropTypes from "prop-types";
import { components } from "react-select";

export function SelectMenuListWithScroll(props) {
  const onScrollToBottom = props.selectProps?.onMenuScrollToBottom;
  return (
    <components.MenuList
      {...props}
      innerProps={{
        ...props.innerProps,
        onScroll: onScrollToBottom
          ? (e) => {
              const el = e.currentTarget;
              if (el.scrollHeight - el.scrollTop <= el.clientHeight + 30) {
                onScrollToBottom();
              }
              props.innerProps?.onScroll?.(e);
            }
          : props.innerProps?.onScroll,
      }}
    />
  );
}

SelectMenuListWithScroll.propTypes = {
  selectProps: PropTypes.shape({
    onMenuScrollToBottom: PropTypes.func,
  }),
  innerProps: PropTypes.object,
};

export default SelectMenuListWithScroll;
