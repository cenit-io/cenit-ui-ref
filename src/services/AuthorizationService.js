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

const appGateway = axios.create({
    baseURL: `${Config.cenitHost}/app/${Config.appIdentifier}`,
    timeout: Config.timeoutSpan,
});

appGateway.interceptors.request.use(async config => {
    const accessToken = await AuthorizationService.getAccessToken().toPromise();
    if (!config.headers) {
        config.headers = {};
    }
    config.headers.Authorization = `Bearer ${accessToken}`;
    const xTenantId = AuthorizationService.getXTenantId();
    if (xTenantId) {
        config.headers['X-Tenant-Id'] = xTenantId;
    }

    return config;
});

export const AccessKey = 'access';

const AuthorizationService = {

    getXTenantId: function () {
        return this.xTenantId;
    },

    setXTenantId: function (id) {
        this.xTenantId = id;
    },

    getTenantAccess: function () {
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
            return of({ access, tenantId: this.getXTenantId() });
        }

        window.parent.postMessage({
            cmd: 'getAccess',
            token: this.token
        }, '*');

        return fromEvent(window, 'message').pipe(
            map(({ data }) => data || {}),
            filter(({ access }) => access),
            tap(({ access, tenantId }) => {
                this[AccessKey] = access;
                this.setXTenantId(tenantId);
            }),
        )
    },

    getAccess: function () {
        return this.getTenantAccess().pipe(
            map(({ access }) => access)
        );
    },

    getAccessToken: function () {
        return this.getAccess().pipe(
            map(access => (access && access.access_token) || null)
        );
    },

    get: function (path) {
        return from(appGateway.get(path)).pipe(
            map(response => response.data)
        );
    },

    post: function (path, data = null) {
        return from(appGateway.post(path, data)).pipe(
            map(response => response.data)
        );
    },

    delete: function (path, data = null) {
        return from(appGateway.delete(path, { data })).pipe(
            map(response => response.data)
        );
    },

    request: function (opts) {
        if (opts.path) {
            opts = { ...opts, url: `${Config.cenitHost}${opts.path}` }
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
