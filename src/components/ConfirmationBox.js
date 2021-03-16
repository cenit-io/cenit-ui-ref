import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import AuthorizationService from "../services/AuthorizationService";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core";
import CheckIcon from "@material-ui/icons/CheckCircle";
import Box from "./Box";
import WarningIcon from "@material-ui/icons/WarningOutlined";
import SendIcon from "@material-ui/icons/SendOutlined";
import { catchError, switchMap, delay } from "rxjs/operators";
import InfoIcon from "@material-ui/icons/InfoOutlined";
import EmailIcon from "@material-ui/icons/EmailOutlined";
import { of } from "rxjs";
import LinearProgress from "@material-ui/core/LinearProgress";
import { useSubscriptionContext } from "./SubscriptionContext";

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
    },
    check: {
        color: theme.palette.success.main
    },
    warning: {
        color: theme.palette.warning.main
    },
    info: {
        color: theme.palette.info.main
    },
    progress: {
        width: '100%',
        height: theme.spacing(4)
    }
}));

export default function ConfirmationBox() {

    const [state, setState] = useSpreadState();

    const [subscriptionState, setSubscriptionState] = useSubscriptionContext();

    const { user } = subscriptionState;

    const { confirming, email, tried, timer } = state;

    const classes = useStyles();

    useEffect(() => {
        if (confirming) {
            const subscription = confirming.pipe(
                catchError(() => of({}))
            ).subscribe(({ email }) => setState({
                confirming: null,
                email,
                tried: true,
                timer: 10
            }));

            return () => subscription.unsubscribe();
        }
    }, [user, confirming]);

    useEffect(() => {
        if (timer) {
            const subscription = of(true).pipe(
                delay(1000 * timer),
                switchMap(() => AuthorizationService.get('account_confirmation'))
            ).subscribe(({ email }) => {
                if (email) {
                    setSubscriptionState({
                        user: {
                            ...user,
                            confirmed: true
                        }
                    })
                } else {
                    setState({ timer: timer + 1 })
                }
            });

            return () => subscription.unsubscribe();
        }
    }, [timer]);


    if (user.confirmed) {
        return (
            <Box title="Confirmation"
                 action={<CheckIcon className={classes.check}/>}>
                <Typography variant="body2" component="p" className={classes.summary}>
                    Your account is confirmed
                </Typography>
            </Box>
        );
    }

    const sendConfirmationInstructions = () => setState({
        confirming: AuthorizationService.post('confirm_account')
    });

    let action;
    if (confirming) {
        action = (
            <div className={classes.progress}>
                <LinearProgress className="full-width"/>
            </div>
        );
    } else if (email) {
        action = <EmailIcon/>;
    } else {
        const msg = tried ? 'Try again' : 'Confirm';
        action = (
            <Button onClick={sendConfirmationInstructions}
                    endIcon={<SendIcon component="svg"/>}>
                {msg}
            </Button>
        );
    }

    let alert;
    if (email) {
        alert = 'A email with confirmation instructions was sent to your email';
    } else {
        alert = 'Your account is NOT confirmed';
    }
    let Icon = email ? InfoIcon : WarningIcon;
    return (
        <Box title="Confirmation"
             action={action}>
            <Icon component="svg" className={(email && classes.info) || classes.warning}/>
            <Typography variant="body2" component="p" className={(email && classes.info) || classes.warning}>
                {alert}
            </Typography>
        </Box>
    );
};
