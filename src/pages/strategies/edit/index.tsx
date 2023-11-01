import { EditStrategyMain } from 'components/strategies/edit';
import { MyLocationGenerics } from 'components/trade/useTradeTokens';
import { PathNames, useNavigate } from 'libs/routing';
import { useWeb3 } from 'libs/web3';
import { useEffect } from 'react';
import { useStore } from 'store';
import { StrategiesPage } from '..';
import { Route } from '@tanstack/react-router';
import { appRoute } from 'App';

export const EditStrategyPage = () => {
  const { user } = useWeb3();
  const {
    strategies: { strategyToEdit },
  } = useStore();
  const navigate = useNavigate<MyLocationGenerics>();

  useEffect(() => {
    if (!user || !strategyToEdit) {
      navigate({ to: PathNames.strategies });
    }
  }, [user, strategyToEdit, navigate]);

  return user && strategyToEdit ? (
    <EditStrategyMain strategy={strategyToEdit} />
  ) : (
    <StrategiesPage />
  );
};

export const editStrategyPage = new Route({
  getParentRoute: () => appRoute,
  path: PathNames.editStrategy,
  component: EditStrategyPage,
});
