import axios from "axios";
import { from, fromEvent, of } from "rxjs";
import { switchMap, filter, map, tap } from "rxjs/operators";

export const AppConfig = window.appConfig;

const EnvironmentConfig = {
    localhost: process.env.REACT_APP_LOCALHOST,
    cenitHost: process.env.REACT_APP_CENIT_HOST,
    timeoutSpan: +process.env.REACT_APP_TIMEOUT_SPAN,
    appIdentifier: process.env.REACT_APP_APP_ID
};

export const Config = AppConfig.useEnvironmentConfig ? EnvironmentConfig : AppConfig;

export const CenitHostKey = 'cenitHost';

Config.getCenitHost = function () {
    return localStorage.getItem(CenitHostKey) || this.cenitHost;
};

const appGateway = axios.create({
    baseURL: `${Config.getCenitHost()}/app/${Config.appIdentifier}`,
    timeout: Config.timeoutSpan,
});

export const AccessKey = 'access';

const AuthorizationService = {

    getAccess: function () {
        let access;
        try {
            access = this[AccessKey];
            let expirationDate = new Date(access.created_at + access.expires_in + Config.timeoutSpan);
            if (expirationDate < new Date()) {
                access = null;
            }
        } catch (e) {
            access = null;
        }

        if (access) {
            return of(access);
        }

        window.parent.postMessage({
            cmd: 'getAccess',
            token: this.token
        }, '*');

        return fromEvent(window, 'message').pipe(
            tap(({ data }) => console.log('AAA', data)),
            map(({ data }) => data?.access),
            filter(access => access),
            tap(access => this[AccessKey] = access)
        )
    },

    getAccessToken: function () {
        return this.getAccess().pipe(
            map(access => (access && access.access_token) || null)
        );
    },

    get: function (path) {
        return this.getAccess().pipe(
            switchMap(access => from(
                appGateway.get(path, {
                    headers: { Authorization: `Bearer ${access.access_token}` }
                })
            ).pipe(map(response => response.data)))
        );
    },

    post: function (path, data = null) {
        return this.getAccess().pipe(
            switchMap(access => from(
                appGateway.post(path, data, {
                    headers: { Authorization: `Bearer ${access.access_token}` }
                })
            ).pipe(map(response => response.data)))
        );
    },

    delete: function (path, data = null) {
        return this.getAccess().pipe(
            switchMap(access => from(
                appGateway.delete(path, {
                    headers: { Authorization: `Bearer ${access.access_token}` },
                    data
                })
            ).pipe(map(response => response.data)))
        );
    },

    request: function (opts) {
        if (opts.path) {
            opts = { ...opts, url: `${Config.getCenitHost()}${opts.path}` }
        }
        return this.getAccess().pipe(
            switchMap(
                access => {
                    const headers = { ...opts.headers };
                    headers.Authorization = `Bearer ${access.access_token}`;
                    opts = { ...opts, headers };
                    return from(axios(opts));
                }
            ),
            map(
                response => response.data
            )
        );
    }
};

export default AuthorizationService;
