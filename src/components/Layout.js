import IconButton from "@material-ui/core/IconButton";
import BackIcon from "@material-ui/icons/KeyboardBackspace";
import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core";
import { useSubscriptionContext } from "./SubscriptionContext";
import { HOME, PAYMENT_METHOD, PLANS, SUBSCRIBE, UNSUBSCRIBE } from "./routes";
import Status from "./Status";
import CardForm from "./CardForm";
import Plans from "./Plans";
import Subscribe from "./Subscribe";
import Unsubscribe from "./Unsubscribe";
import { Switch, Route } from "react-router-dom";

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

export default function Layout() {

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
                <div className="flex justify-content-center align-items-center relative">
                    <Switch>
                        <Route exact path={HOME}>
                            <Status/>
                        </Route>
                        <Route path={PAYMENT_METHOD}>
                            <CardForm/>
                        </Route>
                        <Route path={PLANS}>
                            <Plans/>
                        </Route>
                        <Route path={SUBSCRIBE(':plan_id')}>
                            <Subscribe/>
                        </Route>
                        <Route path={UNSUBSCRIBE(':plan_id')}>
                            <Unsubscribe/>
                        </Route>
                    </Switch>
                </div>
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
