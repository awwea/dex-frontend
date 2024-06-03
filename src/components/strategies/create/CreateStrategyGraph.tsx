import { m } from 'libs/motion';
import { items } from './variants';
import { Button } from 'components/common/button';
import { ReactComponent as IconX } from 'assets/icons/X.svg';
import { carbonEvents } from 'services/events';
import { FC, ReactNode } from 'react';

type Props = {
  showGraph: boolean;
  setShowGraph: (value: boolean) => void;
  children: ReactNode;
};
export const CreateStrategyGraph: FC<Props> = ({
  showGraph,
  setShowGraph,
  children,
}) => {
  return (
    <div
      className={`flex flex-col ${showGraph ? 'flex-1' : 'absolute right-20'}`}
    >
      <m.div
        variants={items}
        key="createStrategyGraph"
        className="rounded-10 bg-background-900 flex h-[550px] flex-col p-20 md:sticky md:top-80"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-weight-500 mb-20">Price Chart</h2>
          <Button
            className="bg-background-800 hover:border-background-600 mb-20 self-end"
            variant="secondary"
            size="md"
            onClick={() => {
              carbonEvents.strategy.strategyChartClose(undefined);
              setShowGraph(false);
            }}
          >
            <div className="flex items-center justify-center">
              <IconX className="w-10 md:mr-12" />
              <span className="hidden md:block">Close Chart</span>
            </div>
          </Button>
        </div>
        {children}
      </m.div>
    </div>
  );
};
