import React, { useCallback, useEffect, useRef } from 'react'
import MaterialAlert from "@material-ui/lab/Alert";
import useResizeObserver from "@react-hook/resize-observer";
import AuthorizationService, { Config } from "../services/AuthorizationService";
import { useSpreadState } from "../common/hooks";
import human from 'human-time';
import { makeStyles } from "@material-ui/core";
import { fromEvent } from "rxjs";

const useStyles = makeStyles(theme => ({
    warn: {
        '& + &': {
            marginTop: theme.spacing(1)
        }
    },
    danger: {
        color: theme.palette.error.main,
        fontWeight: 'bold',
    },
    link: {
        fontWeight: 'bold',
        cursor: 'pointer',
        textDecoration: 'underline'
    }
}));

export default function Alert() {

    const [state, setState] = useSpreadState({
        now: new Date()
    });

    const { user, closed, now } = state;

    const alert = useRef(null);
    const tenantDataTypeId = useRef(null);

    const classes = useStyles();

    useResizeObserver(alert, entry => {
        window.parent.postMessage({
            cmd: 'resize',
            height: entry.contentRect.height,
            token: AuthorizationService.token
        }, '*');
    });

    useEffect(() => {
        const subscription = fromEvent(window, 'message').subscribe(
            ({ data: { cmd } }) => {
                if (cmd === 'refresh') {
                    setState({ now: new Date(), closed: false });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = AuthorizationService.request({
            path: '/api/v3/setup/account?limit=0'
        }).subscribe(
            ({ data_type: { id } }) => tenantDataTypeId.current = id
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = AuthorizationService.request({
            path: '/api/v3/setup/user/me',
            headers: {
                'X-Template-Options': JSON.stringify({
                    viewport: '{subscribed trial_enabled account{id locked active_until}'
                })
            }
        }).subscribe(user => setState({ user }));

        return () => subscription.unsubscribe();
    }, [now]);

    const unlockTenant = useCallback(() => {
        if (user) {
            window.parent.postMessage({
                cmd: 'openTab',
                dataTypeId: tenantDataTypeId.current,
                recordId: user.account.id,
                actionKey: { key: 'switch_tenant_lock' },
                token: AuthorizationService.token
            }, '*');
        }
    }, [user]);

    const openBillingApp = useCallback(() => {
        if (user) {
            window.parent.postMessage({
                cmd: 'openTab',
                embeddedApp: {
                    url: Config.localhost
                },
                token: AuthorizationService.token
            }, '*');
        }
    }, [user]);

    let theAlert;
    if (!closed && user) {
        const { trial_enabled, subscribed, account: { id: tenantId, locked, active_until } } = user;

        let duration;
        if (active_until) {
            const activeUntil = new Date(active_until);
            if (activeUntil > now) {
                duration = (
                    <div className={classes.warn}>
                        This tenant is active for {human(activeUntil)}.
                    </div>
                );
            } else if (locked || (!subscribed && !trial_enabled)) {
                duration = (
                    <div className={classes.warn}>
                        This tenant is <span className={classes.danger}>DISABLED</span> and your tasks won't be
                        executed.
                    </div>
                );
            }
        }

        let unlock;
        if (locked && !trial_enabled) {
            unlock = (
                <div className={classes.warn}>
                    This tenant is <span className={classes.danger}>locked</span> and won't be reactivated, <span
                    className={classes.link}
                    onClick={unlockTenant}>
                    click here</span> to unlock this tenant.
                </div>
            );
        }

        let billing;
        if (!subscribed && !trial_enabled) {
            billing = (
                <div className={classes.warn}>
                    To activate your tenants go to your <span className={classes.link} onClick={openBillingApp}>
                    billing settings</span> and subscribe to a plan for a tenant activation.
                </div>
            )
        }

        if (unlock || billing) {
            const severity = unlock || billing
                ? 'warning'
                : 'info';
            theAlert = (
                <MaterialAlert onClose={() => setState({ closed: true })} severity={severity}>
                    {duration}
                    {unlock}
                    {billing}
                </MaterialAlert>
            );
        }
    }

    return (
        <div ref={alert}>
            {theAlert}
        </div>
    );
}
