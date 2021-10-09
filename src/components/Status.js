import React, { useEffect } from 'react';
import AuthorizationService, { Config } from "../services/AuthorizationService";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core";
import ConfirmationBox from "./ConfirmationBox";
import Box from "./Box";
import { useHistory } from "react-router-dom";
import { useSubscriptionContext } from "./SubscriptionContext";
import PaymentBox from "./PaymentBox";
import { PLANS, UNSUBSCRIBE } from "./routes";
import { useGoBack } from "./Layout";

const useStyles = makeStyles(theme => ({
    card: {
        width: theme.spacing(24),
        margin: theme.spacing(2)
    },
    title: {
        textAlign: 'center'
    },
    summary: {
        margin: theme.spacing(2, 0),
        textAlign: 'center'
    }
}));

export default function Status() {

    useGoBack();

    const history = useHistory();

    const classes = useStyles();

    const [subscriptionState, setSubscriptionState] = useSubscriptionContext();

    const { subscriptions, user } = subscriptionState;

    useEffect(() => {
        setSubscriptionState({
            observable: AuthorizationService.get('status')
        });
        window.parent.postMessage({
            cmd: 'send',
            domain: Config.localhost,
            message: {
                cmd: 'refresh'
            },
            token: AuthorizationService.token
        }, '*');
    }, []);

    if (!user) {
        return <div/>;
    }

    const unsubscribe = planId => () => history.push(UNSUBSCRIBE(planId));

    let plans;
    if (subscriptions.length) {
        plans = subscriptions.map(({ id, nickname, summary }) => (
            <Box key={id}
                 title={nickname}
                 action={
                     <Button onClick={unsubscribe(id)}>
                         Unsubscribe
                     </Button>
                 }>
                <CardContent component="div">
                    <Typography variant="body2" component="p" className={classes.summary}>
                        {summary}
                    </Typography>
                </CardContent>
            </Box>
        ));
        plans.push(
            <Box key="plans"
                 title="Other plans"
                 action={
                     <Button onClick={() => history.push(PLANS)}>
                         Explore
                     </Button>
                 }>
                <Typography variant="body2" component="p" className={classes.summary}>
                    Other plans are available
                </Typography>
            </Box>
        )
    } else {
        plans = (
            <Box title="No subscriptions"
                 action={
                     <Button onClick={() => history.push(PLANS)}>
                         Take a look
                     </Button>
                 }>
                <Typography variant="body2" component="p" className={classes.summary}>
                    You're not subscribed to any plan
                </Typography>
            </Box>
        );
    }

    return (
        <div className="flex wrap align-items-center justify-content-center">
            {plans}
            <ConfirmationBox user={user}/>
            <PaymentBox/>
        </div>
    );
};
