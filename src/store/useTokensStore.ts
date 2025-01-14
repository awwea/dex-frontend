import { uniqBy } from 'lodash';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Token } from 'libs/tokens';
import { useTokensQuery } from 'libs/queries';

export interface TokensStore {
    tokens: Token[];
    importedTokens: Token[];
    setImportedTokens: Dispatch<SetStateAction<Token[]>>;
    tokensMap: Map<string, Token>;
    isPending: boolean;
    isError: boolean;
    error: unknown;
}

export const useTokensStore = (): TokensStore => {
    const tokensQuery = useTokensQuery();
    const [importedTokens, setImportedTokens] = useState<Token[]>([]);

    const tokens = useMemo(() => {
        if (tokensQuery.data && tokensQuery.data.length) {
            return uniqBy([...tokensQuery.data, ...importedTokens], (token) => token.address);
        }
        return [];
    }, [tokensQuery.data, importedTokens]);

    const tokensMap = useMemo(
        () => new Map(tokens.map((token) => [token.address.toLowerCase(), token])),
        [tokens]
    );

    const isPending = tokensQuery.isPending;
    const isError = tokensQuery.isError;
    const error = tokensQuery.error;

    return {
        tokens,
        importedTokens,
        tokensMap,
        isPending,
        isError,
        error,
        setImportedTokens,
    };
};

export const defaultTokensStore: TokensStore = {
    tokens: [],
    importedTokens: [],
    setImportedTokens: () => {},
    tokensMap: new Map(),
    isPending: false,
    isError: false,
    error: undefined,
};
