import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from "@stripe/react-stripe-js";
import TextField from "@material-ui/core/TextField";
import FormHelperText from "@material-ui/core/FormHelperText";
import { makeStyles } from "@material-ui/core";
import { useSpreadState } from "../common/hooks";
import Alert from "@material-ui/lab/Alert/Alert";
import Button from "@material-ui/core/Button";
import { from, of } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import AuthorizationService from "../services/AuthorizationService";
import { useSubscriptionContext } from "./SubscriptionContext";
import { useHistory } from "react-router-dom";
import { HOME } from "./routes";
import { useGoBack } from "./Layout";

function StripeInput(
    { component: Component, inputRef, ...props }
) {
    const elementRef = useRef();

    useImperativeHandle(inputRef, () => ({
        focus: () => elementRef.current.focus
    }));

    return <Component
        onReady={element => (elementRef.current = element)}
        {...props}
    />;
}

const useElementStyles = makeStyles(theme => ({
    root: {
        marginBottom: theme.spacing(1)
    },
    error: {
        color: theme.palette.error.main
    }
}));


function StripeElement({ label, element, onChange }) {

    const [error, setError] = useState(' ');

    const handleChange = e => {
        setError((e.error && e.error.message) || ' ');
        onChange && onChange(e);
    };

    const classes = useElementStyles();

    return (
        <div className={classes.root}>
            <TextField
                label={label}
                variant="filled"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    inputComponent: StripeInput,
                    inputProps: {
                        component: element,
                        onChange: handleChange
                    }
                }}
            />
            <FormHelperText component="p" className={classes.error}>
                {error}
            </FormHelperText>
        </div>
    );
}

const useFormStyles = makeStyles(theme => ({
    elements: {
        marginTop: theme.spacing(2)
    },
    alert: {
        marginBottom: theme.spacing(2)
    }
}));

export function StripeForm() {

    const [state, setState] = useSpreadState();

    const classes = useFormStyles();

    const history = useHistory();

    const stripe = useStripe();

    const elements = useElements();

    const [subscriptionState, setSubscriptionState] = useSubscriptionContext();

    const { user } = subscriptionState;

    const { card, expiry, cvc, tokenObserver, disabled } = state;

    useEffect(() => {
        if (history && !user.confirmed) {
            history.push(HOME);
        }
    }, [user, history]);

    const setDisabled = useCallback(disabled => {
        elements.getElement(CardNumberElement).update({ disabled });
        elements.getElement(CardExpiryElement).update({ disabled });
        elements.getElement(CardCvcElement).update({ disabled });
        setState({ disabled });
    }, [elements]);

    useEffect(() => {
        if (tokenObserver) {
            setDisabled(true);
            const subscription = tokenObserver.subscribe(
                () => setDisabled(false)
            );

            return () => subscription.unsubscribe();
        }
    }, [tokenObserver, setDisabled]);

    const handleChange = key => e => setState({ [key]: e.complete });

    const registerCard = () => {

        const cardNumberElement = elements.getElement(CardNumberElement);

        setSubscriptionState({
            observable: from(stripe.createToken(cardNumberElement)).pipe(
                switchMap(({ error, token }) => {
                    if (error) {
                        return of({});
                    }

                    return AuthorizationService.post('source', token);
                }),
                tap(({ source }) => {
                    if (source) {
                        setSubscriptionState({ source });
                        history.goBack();
                    }
                })
            )
        });
    };

    return (
        <div className="flex column">
            <div className={classes.elements}>
                <StripeElement label="Card Number"
                               element={CardNumberElement}
                               onChange={handleChange('card')}/>

                <StripeElement label="Expiry Date"
                               element={CardExpiryElement}
                               onChange={handleChange('expiry')}/>

                <StripeElement label="CVC"
                               element={CardCvcElement}
                               onChange={handleChange('cvc')}/>
            </div>

            <Alert severity="info" className={classes.alert}>
                This is a <b>secure form</b> and the card data you provide can not be retrieved later to be used
                for charges in other systems
            </Alert>

            <div className="flex justify-content-flex-end">
                <Button color="primary"
                        variant="outlined"
                        disabled={disabled || !card || !expiry || !cvc}
                        onClick={registerCard}>
                    Submit
                </Button>
            </div>
        </div>
    );
}

const useCardFormStyles = makeStyles(theme => ({
    form: {
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(3)
    }
}));

export default function CardForm() {

    const [publicKey, setPublicKey] = useState();

    useGoBack();

    const [subscriptionContext, setSubscriptionContext] = useSubscriptionContext();
    const classes = useCardFormStyles();

    useEffect(() => {
        setSubscriptionContext({
            observable: AuthorizationService.get('public_key').pipe(
                map(({ public_key }) => setPublicKey(public_key))
            )
        });
    }, []);

    if (!publicKey) {
        return <div/>;
    }

    const stripe = loadStripe(publicKey);

    let alert;
    if (!subscriptionContext.source) {
        alert = (
            <Alert severity="info">
                Your card will not be charged at this time. It will be kept for future charges perhaps when you get
                subscribed to a plan.
            </Alert>
        );
    }
    return (
        <div className={classes.form}>
            {alert}
            <Elements stripe={stripe}>
                <StripeForm/>
            </Elements>
        </div>
    );
}
