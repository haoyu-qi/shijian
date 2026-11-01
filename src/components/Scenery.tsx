export function Scenery() {
  return (
    <svg
      className="scenery"
      viewBox="0 0 280 700"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="bamboo" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M-15 620Q20 460 2 307M-8 544Q47 456 62 388M2 493L68 463M3 424L-5 365" />
        <g fill="currentColor" stroke="none">
          <path d="M14 475Q41 431 44 415Q15 433 14 475M29 451Q71 428 80 429Q59 455 29 451M2 417Q23 374 18 350Q-1 379 2 417M46 419Q81 391 78 372Q51 385 46 419M12 519Q45 495 57 496Q42 519 12 519M8 501Q-5 474-17 470Q-13 498 8 501M40 473Q60 445 72 442Q68 469 40 473" />
        </g>
      </g>
      <g className="mountains" fill="currentColor">
        <path
          d="M0 612L28 584 39 592 66 552 81 569 95 558 125 586 144 577 174 602 202 572 218 580 246 546 280 568V650H0Z"
          opacity=".28"
        />
        <path
          d="M0 633L35 616 64 624 102 593 132 610 154 600 189 627 224 615 258 588 280 604V654H0Z"
          opacity=".2"
        />
      </g>
      <path
        d="M190 85q7-9 14 0q7-9 14 0M219 95q4-5 8 0q4-5 8 0"
        fill="none"
        stroke="currentColor"
        opacity=".22"
      />
      <circle cx="238" cy="61" r="16" fill="var(--accent)" opacity=".08" />
    </svg>
  );
}
