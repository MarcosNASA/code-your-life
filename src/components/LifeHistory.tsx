import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import {
  isLifeHistoryImageEvent,
  isLifeHistoryTextEvent,
  type LifeHistoryImageEvent,
  type LifeHistoryTextEvent,
  type LifeHistoryDecade,
  type LifeHistoryEvent,
  type LifeHistoryMonth,
  type LifeHistoryMonthNumber,
  type LifeHistoryYear,
  MonthlyLifeHistory,
  LifeHistory as LifeHistoryDomain,
} from "../domain/LifeHistory";

import { Draggable } from "./drag-and-drop/Draggable";
import { Droppable } from "./drag-and-drop/Droppable";

type LifeHistoryEventWithMonth = {
  event: LifeHistoryEvent;
  month: LifeHistoryMonth;
};

export const LifeHistory = () => {
  const [lifeHistory, setLifeHistory] = useState<MonthlyLifeHistory>(
    LifeHistoryDomain.initiate
  );
  const [draggedEventWithMonth, setDraggedEventWithMonth] =
    useState<LifeHistoryEventWithMonth | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (!active.data.current) return;

    setDraggedEventWithMonth({
      event: active.data.current.event,
      month: active.data.current.month,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active) return;
    if (!over) return;
    if (!active.data.current) return;
    if (!over.data.current) return;

    const lifeHistoryEvent = active.data.current.event;

    const sourceMonth = active.data.current.month;

    const targetMonth = over.data.current.month;

    setLifeHistory((lifeHistory) =>
      LifeHistoryDomain.moveEvent({
        event: lifeHistoryEvent,
        lifeHistory,
        sourceMonth,
        targetMonth,
      })
    );

    setDraggedEventWithMonth(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col gap-2">
        {lifeHistory.map(({ id, decade, years }) => (
          <LifeHistoryDecade key={id} {...{ id, decade, years }} />
        ))}
      </div>

      <DragOverlay>
        {draggedEventWithMonth ? (
          <LifeHistoryEvent {...draggedEventWithMonth} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const LifeHistoryDecade = ({ decade, years }: LifeHistoryDecade) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <>Decade {decade}</>

      <div className="flex flex-col gap-2">
        {years.map(({ id, year, months }) => (
          <LifeHistoryYear key={id} {...{ id, year, months }} />
        ))}
      </div>
    </div>
  );
};

const LifeHistoryYear = ({ year, months }: LifeHistoryYear) => {
  return (
    <div className="w-full p-2 bg-slate-200 rounded-lg">
      <div className="w-full flex gap-2">
        <div className="p-2 rounded-lg bg-slate-300 grid items-center">
          <span className="text-center text-sm">Year {year}</span>
        </div>

        <div className="w-full grid auto-rows-[190px] grid-cols-[repeat(auto-fit,_minmax(190px,_1fr))] gap-2">
          {months.map(({ id, month, events }) => (
            <LifeHistoryMonth key={id} {...{ id, month, events }} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MONTH_NUMBER_TO_NAME = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
} as const satisfies Record<LifeHistoryMonthNumber, string>;
const LifeHistoryMonth = ({ id, month, events }: LifeHistoryMonth) => {
  return (
    <div className="p-4 bg-slate-300 rounded-lg">
      <div className="w-full flex flex-col gap-2">
        <>{MONTH_NUMBER_TO_NAME[month]}</>

        <Droppable id={id} data={{ month: { id, month, events } }}>
          <div className="w-full grid grid-cols-[repeat(auto-fill,_minmax(25%,_1fr))] gap-2">
            {events.map((event) => (
              <LifeHistoryEvent
                key={event.id}
                month={{ id, month, events }}
                event={event}
              />
            ))}
          </div>
        </Droppable>
      </div>
    </div>
  );
};

const LifeHistoryEvent = ({
  event,
  month,
}: {
  event: LifeHistoryEvent;
  month: LifeHistoryMonth;
}) => {
  return (
    <Draggable id={event.id} data={{ event, month }}>
      {isLifeHistoryTextEvent(event) && <LifeHistoryTextEvent event={event} />}
      {isLifeHistoryImageEvent(event) && (
        <LifeHistoryImageEvent event={event} />
      )}
    </Draggable>
  );
};

const LifeHistoryTextEvent = ({ event }: { event: LifeHistoryTextEvent }) => {
  return (
    <div className="p-4 bg-white rounded-md grid items-center">
      <span className="text-sm ellipsis">{event.event_text}</span>
    </div>
  );
};

const LifeHistoryImageEvent = ({ event }: { event: LifeHistoryImageEvent }) => {
  return <img src={event.event_image} alt="" />;
};
