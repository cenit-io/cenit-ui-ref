import React, { useCallback, useEffect, useRef } from 'react'
import MaterialAlert from "@material-ui/lab/Alert";
import useResizeObserver from "@react-hook/resize-observer";
import AuthorizationService, { Config } from "../services/AuthorizationService";
import { useSpreadState } from "../common/hooks";
import human from 'human-time';
import { makeStyles } from "@material-ui/core";
import { fromEvent, of, zip } from "rxjs";
import { PLANS } from "./routes";
import { switchMap } from "rxjs/operators";

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

    const { user, tenant, closed, now } = state;

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
            ({ data: { cmd, tenantId } }) => {
                if (cmd === 'refresh') {
                    AuthorizationService.setXTenantId(tenantId);
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
        const subscription = AuthorizationService.getTenantAccess().pipe(
            switchMap(({ tenantId }) => zip(
                AuthorizationService.request({
                    path: '/api/v3/setup/user/me',
                    headers: {
                        'X-Template-Options': JSON.stringify({
                            viewport: '{subscribed trial_enabled account{id locked active_until}}'
                        })
                    }
                }),
                tenantId ? AuthorizationService.request({
                    path: `/api/v3/setup/account/${tenantId}`,
                    headers: {
                        'X-Template-Options': JSON.stringify({
                            viewport: '{id locked active_until}'
                        })
                    }
                }) : of(null)
            ))
        ).subscribe(([user, tenant]) => setState({ user, tenant: tenant || user.account }));

        return () => subscription.unsubscribe();
    }, [now]);

    const unlockTenant = useCallback(() => {
        if (tenant) {
            window.parent.postMessage({
                cmd: 'openTab',
                dataTypeId: tenantDataTypeId.current,
                recordId: tenant.id,
                token: AuthorizationService.token
            }, '*');
        }
    }, [tenant]);

    const openBillingApp = useCallback(() => {
        if (user) {
            window.parent.postMessage({
                cmd: 'openTab',
                embeddedApp: {
                    url: Config.localhost,
                    route: PLANS
                },
                token: AuthorizationService.token
            }, '*');
        }
    }, [user]);

    let theAlert;
    if (!closed && user && tenant) {
        const { trial_enabled, subscribed } = user;
        const { locked, active_until } = tenant;

        let unlock;
        if (locked) {
            unlock = (
                <div className={classes.warn}>
                    This tenant is <span className={classes.danger}>locked</span>, <span
                    className={classes.link}
                    onClick={unlockTenant}>
                    click here</span> to unlock this tenant.
                </div>
            );
        }

        let duration;
        let billing;
        if (!subscribed && !trial_enabled) {
            billing = (
                <div className={classes.warn}>
                    To activate your tenants go to your <span className={classes.link} onClick={openBillingApp}>
                    billing settings</span> and subscribe to a plan for a tenant activation.
                </div>
            );
            if (active_until) {
                const activeUntil = new Date(active_until);
                if (activeUntil > now) {
                    duration = (
                        <div className={classes.warn}>
                            This tenant is active for {human(activeUntil)}.
                        </div>
                    );
                } else if (!subscribed && !trial_enabled) {
                    duration = (
                        <div className={classes.warn}>
                            This tenant is <span className={classes.danger}>DISABLED</span> because activation
                            expired {human(activeUntil)}.
                        </div>
                    );
                }
            }
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
