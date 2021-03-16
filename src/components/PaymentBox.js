import React from 'react';
import AuthorizationService from "../services/AuthorizationService";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Box from "./Box";
import { useSubscriptionContext } from "./SubscriptionContext";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/PublishedWithChangesOutlined";
import CreditCardIcon from "@material-ui/icons/CreditCardOutlined";
import DeleteIcon from "@material-ui/icons/DeleteOutline";
import { useHistory } from "react-router-dom";
import { PAYMENT_METHOD } from "./routes";
import { map, switchMap } from 'rxjs/operators';
import { of } from "rxjs";

export default function PaymentBox() {

    const subscriptionContext = useSubscriptionContext();

    const [subscriptionState, setSubscriptionState] = subscriptionContext;

    const { user, source, has_invoices, has_subscriptions } = subscriptionState;

    const history = useHistory();

    const paymentMethod = source ? (
        <>
            <Typography variant="body2" component="span">
                {source.brand}
            </Typography>
            <Typography variant="body2" component="span">
                **** **** **** {source.last4}
            </Typography>
        </>
    ) : (
        <Typography variant="body2" component="p">
            No payment method registered
        </Typography>
    );

    const handleAdd = () => {
        if (user.confirmed) {
            history.push(PAYMENT_METHOD);
        } else {
            setSubscriptionState({
                observable: subscriptionContext.confirm({
                    title: 'Notice',
                    message: 'Please confirm you account and then add a payment method',
                    cancelable: false
                })
            })
        }
    };

    let paymentActions;
    if (source) {
        const handleDelete = () => {
            let observable;
            if (has_subscriptions || has_invoices) {
                let message = "The payment method cannot be removed at this moment because";
                if (has_subscriptions) {
                    message = `${message} there are active subscriptions`;
                }
                if (has_invoices) {
                    if (has_subscriptions) {
                        message = `${message} and`;
                    }
                    message = `${message} there are pending invoices`;
                }
                observable = subscriptionContext.confirm({
                    title: 'Notice',
                    message,
                    cancelable: false
                });
            } else {
                observable = subscriptionContext.confirm({
                    title: 'Confirmation',
                    message: 'The registered payment method will be removed'
                }).pipe(
                    switchMap(ok => {
                        if (ok) {
                            return AuthorizationService.delete('source').pipe(
                                map(() => ({ source: null }))
                            );
                        }

                        return of(null);
                    })
                );
            }

            setSubscriptionState({ observable });
        };

        paymentActions = (
            <>
                <IconButton onClick={handleDelete}>
                    <DeleteIcon component="svg" fontSize="small"/>
                </IconButton>
                <IconButton onClick={handleAdd} size="medium">
                    <EditIcon component="svg" fontSize="small"/>
                </IconButton>
            </>
        );
    } else {
        paymentActions = (
            <Button onClick={handleAdd}>
                Add
            </Button>
        );
    }

    return (
        <Box title="Payment"
             action={paymentActions}>
            <div className="flex column align-items-center">
                <CreditCardIcon component="svg"/>
                {paymentMethod}
            </div>
        </Box>
    );
};
