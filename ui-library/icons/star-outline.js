import * as React from "react";

function StarOutline(props) {
  return (
    <svg width={12} height={11} fill="none" {...props}>
      <path
        d="M2.832 7.035l-.646 3.637a.278.278 0 00.116.275c.09.062.21.07.306.022l3.39-1.72 3.391 1.718c.044.022.09.03.137.03.061 0 .12-.016.172-.053a.276.276 0 00.116-.275l-.646-3.637 2.745-2.576a.275.275 0 00.072-.289.287.287 0 00-.235-.19l-3.793-.53L6.26.143c-.098-.19-.424-.19-.52 0L4.043 3.45.25 3.983c-.11.014-.2.09-.235.19a.276.276 0 00.072.289l2.745 2.573zm1.444-3.05a.284.284 0 00.218-.154L5.999.9 7.5 3.83c.044.084.125.14.219.154l3.358.471-2.43 2.281a.277.277 0 00-.084.25l.573 3.223-3.004-1.522a.295.295 0 00-.136-.03.335.335 0 00-.137.03l-3 1.52.573-3.224a.272.272 0 00-.085-.25l-2.43-2.28 3.359-.469z"
        fill="#003647"
      />
    </svg>
  );
}

const MemoStarOutline = React.memo(StarOutline);
export default MemoStarOutline;
