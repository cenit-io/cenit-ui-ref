import IconButton from "@material-ui/core/IconButton";
import BackIcon from "@material-ui/icons/KeyboardBackspace";
import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core";
import { useSubscriptionContext } from "./SubscriptionContext";

const H = 6;

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        paddingTop: theme.spacing(H)
    },
    appBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: theme.spacing(H),
    },
    container: {
        height: `calc(100vh - ${theme.spacing(H)}px)`,
        overflow: 'auto'
    }
}));

export default function Layout({ children }) {

    const classes = useStyles();

    const subscriptionContext = useSubscriptionContext();

    const [subscriptionState] = subscriptionContext;

    const { onBack } = subscriptionState;

    const location = useLocation();

    let backButton;
    if (location.pathname !== '/') {
        backButton = (
            <IconButton onClick={() => onBack.next()}>
                <BackIcon/>
            </IconButton>
        );
    }

    return (
        <div className={classes.root}>
            <div className={classes.container}>
                {children}
            </div>
            <div className={classes.appBar}>
                {backButton}
            </div>
        </div>
    );
}


export function useGoBack() {
    const history = useHistory();

    const subscriptionContext = useSubscriptionContext();

    const [subscriptionState] = subscriptionContext;

    const { onBack } = subscriptionState;

    useEffect(() => {
        const subscription = onBack.subscribe(history.goBack);
        return () => subscription.unsubscribe();
    }, [onBack]);
}
