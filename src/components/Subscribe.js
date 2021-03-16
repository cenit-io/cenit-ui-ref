import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import AuthorizationService from "../services/AuthorizationService";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import { useSubscriptionContext } from "./SubscriptionContext";
import { HOME, PAYMENT_METHOD, SUBSCRIBE } from "./routes";
import { map, tap } from 'rxjs/operators';
import Alert from "@material-ui/lab/Alert";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import useTheme from "@material-ui/core/styles/useTheme";
import clsx from "clsx";
import CheckIcon from "@material-ui/icons/Check";
import marked from 'marked';
import { useGoBack } from "./Layout";

const useStyles = makeStyles(theme => ({
    padding1: {
        padding: theme.spacing(1)
    },
    padding2: {
        padding: theme.spacing(2)
    },
    paddingV2: {
        padding: theme.spacing(2, 0)
    },
    secondaryText: {
        color: theme.palette.text.secondary
    },
    borderTop: {
        borderTop: `solid 1px ${theme.palette.text.secondary}`
    }
}));

export default function Subscribe() {

    const [state, setState] = useSpreadState();

    useGoBack();

    const history = useHistory();

    const { plan_id } = useParams();

    const classes = useStyles();

    const theme = useTheme();

    const halfMedia = useMediaQuery(theme.breakpoints.up('sm'));

    const subscriptionContext = useSubscriptionContext();

    const [subscriptionState, setSubscriptionState] = subscriptionContext;

    const { source } = subscriptionState;

    const { review } = state;

    useEffect(() => {
        setSubscriptionState({
            observable: AuthorizationService.get(SUBSCRIBE(plan_id)).pipe(
                tap(review => setState({ review })),
                map(() => null)
            )
        });
    }, [plan_id]);

    if (!review) {
        return <div/>;
    }

    const { plan, line_items, total, billing_date } = review;

    if (!line_items) {
        history.push(HOME);
        return <div/>;
    }

    const subscribe = () => {
        if (source) {
            setSubscriptionState({
                observable: AuthorizationService.post(SUBSCRIBE(plan_id)).pipe(
                    map(() => null),
                    tap(() => history.push(HOME))
                )
            });
        } else {
            setSubscriptionState({
                observable: subscriptionContext.confirm({
                    title: 'Notice',
                    message: 'Please add a payment method before subscribing to a plan'
                }).pipe(
                    tap(ok => ok && history.push(PAYMENT_METHOD))
                )
            });
        }
    };

    const items = line_items.map(item => (
        <div key={`item_${item.id}`}
             className={clsx('flex grow-1', classes.paddingV2)}>
            <div className="grow-1">
                {item.description}
            </div>
            <div>
                {(Math.round(item.amount * 100) / 100).toFixed(2)}
            </div>
            <div>
                {item.type === 'subscription' ? '*' : ' '}
            </div>
        </div>
    ));

    let warning;
    if (line_items.find(({ type }) => type === 'subscription')) {
        warning = (
            <Alert severity="warning">
                The amounts marked with asterisks (*) are previews for the exactly time when they were
                generated and therefore they might change in the future.
            </Alert>
        );
    }

    return (
        <div className={clsx('flex wrap', classes.padding2)}>
            <div className={clsx('flex column border-box', (halfMedia && 'half-width'), classes.padding1)}>
                <div>
                    <Typography component="h5" variant="h5" className={classes.paddingV2}>
                        {plan.nickname}
                    </Typography>
                    <table>
                        <tbody>
                        <tr>
                            <td>
                                <b>Pricing</b>
                            </td>
                            <td>
                                {plan.amount} {plan.currency} / {plan.interval} {plan.usage_type === 'metered' && `per ${plan.product.name}`}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>Description</b>
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: marked(plan.description) }}/>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className={clsx('flex column border-box', (halfMedia && 'half-width'), classes.padding1)}>
                <div>
                    <Typography component="h5" variant="h5" className={classes.paddingV2}>
                        Subscription summary
                    </Typography>
                    {items}
                    <div className={clsx('flex grow-1', classes.paddingV2, classes.borderTop)}>
                        <div className="grow-1">
                            <b>TOTAL</b>
                        </div>
                        <div>
                            <b>{(Math.round(total * 100) / 100).toFixed(2)} {plan.currency.toUpperCase()}</b>
                        </div>
                    </div>
                    <div className={clsx('flex grow-1', classes.paddingV2)}>
                        <div className="grow-1">
                            <b>Billing date</b>
                        </div>
                        <div>
                            <b>{billing_date}</b>
                        </div>
                    </div>
                    <Typography component="div" variant="caption" className={classes.secondaryText}>
                        By clicking "Subscribe" you agree to our terms of service.
                        We’ll occasionally send you account related emails.
                    </Typography>
                    <div className={clsx('flex justify-content-flex-end', classes.paddingV2)}>
                        <Button onClick={subscribe}
                                variant="outlined"
                                endIcon={<CheckIcon/>}>
                            Subscribe
                        </Button>
                    </div>
                    {warning}
                </div>
            </div>
        </div>
    );
};
