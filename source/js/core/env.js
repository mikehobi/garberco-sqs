const DEV = "development";
const PROD = "production";



/**
 *
 * @public
 * @module env
 * @description Set the app environment.
 *
 */
const env = {
    /**
     *
     * @member DEV
     * @memberof core.env
     * @description The development environment CONST.
     *
     */
    DEV,


    /**
     *
     * @member PROD
     * @memberof core.env
     * @description The production environment CONST.
     *
     */
    PROD,


    /**
     *
     * @member ENV
     * @memberof core.env
     * @description The applied environment ref.
     *
     */
    ENV: (/^localhost|squarespace|^[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}/g.test( document.domain ) ? DEV : PROD),


    /**
     *
     * @method isConfig
     * @memberof env
     * @description Determine whether we are in Squarespace /config land or not.
     * @returns {boolean}
     *
     */
    isConfig () {
        return (window.parent.location.pathname.indexOf( "/config" ) !== -1);
    },


    /**
     *
     * @method get
     * @memberof core.isDev
     * @description Returns the dev mode status.
     * @returns {boolean}
     *
     */
    isDev () {
        return (this.ENV === DEV);
    },


    /**
     *
     * @method get
     * @memberof core.isProd
     * @description Returns the dev mode status.
     * @returns {boolean}
     *
     */
    isProd () {
        return (this.ENV === PROD);
    }
};



/******************************************************************************
 * Export
*******************************************************************************/
export default env;
