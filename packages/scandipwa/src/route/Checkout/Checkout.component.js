/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import PropTypes from 'prop-types';
import { lazy, PureComponent, Suspense } from 'react';

import ContentWrapper from 'Component/ContentWrapper';
import { CHECKOUT, CHECKOUT_SUCCESS } from 'Component/Header/Header.config';
import Loader from 'Component/Loader';
import { Addresstype } from 'Type/Account.type';
import {
    CheckoutStepType,
    PaymentMethodsType,
    ShippingMethodsType,
    StoreType
} from 'Type/Checkout.type';
import { TotalsType } from 'Type/MiniCart.type';
import { HistoryType } from 'Type/Router.type';
import { scrollToTop } from 'Util/Browser';
import { noopFn } from 'Util/Common';
import { appendWithStoreCode } from 'Util/Url';

import {
    BILLING_STEP,
    CHECKOUT_URL,
    CHECKOUT_URL_REGEX,
    DETAILS_STEP,
    SHIPPING_STEP
} from './Checkout.config';

import './Checkout.style';

export const CartCoupon = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-info" */
    'Component/CartCoupon'
));

export const CmsBlock = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-info" */
    'Component/CmsBlock'
));

export const CheckoutOrderSummary = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-info" */
    'Component/CheckoutOrderSummary'
));

export const CheckoutBilling = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-billing" */
    'Component/CheckoutBilling'
));

export const CheckoutShipping = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-shipping" */
    'Component/CheckoutShipping'
));

export const CheckoutSuccess = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-success" */
    'Component/CheckoutSuccess'
));

export const ExpandableContent = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "checkout-info" */
    'Component/ExpandableContent'
));

/** @namespace Route/Checkout/Component */
export class Checkout extends PureComponent {
    static propTypes = {
        setLoading: PropTypes.func.isRequired,
        setDetailsStep: PropTypes.func.isRequired,
        shippingMethods: ShippingMethodsType.isRequired,
        onShippingEstimationFieldsChange: PropTypes.func.isRequired,
        setHeaderState: PropTypes.func.isRequired,
        paymentMethods: PaymentMethodsType.isRequired,
        saveAddressInformation: PropTypes.func.isRequired,
        savePaymentInformation: PropTypes.func.isRequired,
        isLoading: PropTypes.bool,
        isDeliveryOptionsLoading: PropTypes.bool.isRequired,
        shippingAddress: Addresstype.isRequired,
        billingAddress: Addresstype.isRequired,
        estimateAddress: Addresstype.isRequired,
        checkoutTotals: TotalsType.isRequired,
        orderID: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        isEmailAvailable: PropTypes.bool.isRequired,
        selectedShippingMethod: PropTypes.string.isRequired,
        history: HistoryType.isRequired,
        onEmailChange: PropTypes.func.isRequired,
        paymentTotals: TotalsType,
        checkoutStep: CheckoutStepType.isRequired,
        isCreateUser: PropTypes.bool.isRequired,
        onCreateUserChange: PropTypes.func.isRequired,
        onPasswordChange: PropTypes.func.isRequired,
        isGuestEmailSaved: PropTypes.bool.isRequired,
        goBack: PropTypes.func.isRequired,
        totals: TotalsType.isRequired,
        isMobile: PropTypes.bool.isRequired,
        isPickInStoreMethodSelected: PropTypes.bool.isRequired,
        handleSelectDeliveryMethod: PropTypes.func.isRequired,
        isInStoreActivated: PropTypes.bool.isRequired,
        cartTotalSubPrice: PropTypes.number,
        onShippingMethodSelect: PropTypes.func.isRequired,
        onStoreSelect: PropTypes.func.isRequired,
        selectedStoreAddress: StoreType,
        onCouponCodeUpdate: PropTypes.func,
        isCartLoading: PropTypes.bool.isRequired
    };

    static defaultProps = {
        paymentTotals: {},
        selectedStoreAddress: {},
        isLoading: false,
        cartTotalSubPrice: null,
        onCouponCodeUpdate: noopFn
    };

    stepMap = {
        [SHIPPING_STEP]: {
            number: 1,
            title: __('Personal information'),
            url: '/shipping',
            render: this.renderShippingStep.bind(this),
            areTotalsVisible: true
        },
        [BILLING_STEP]: {
            number: 2,
            title: __('Payment'),
            url: '/billing',
            render: this.renderBillingStep.bind(this),
            areTotalsVisible: true
        },
        [DETAILS_STEP]: {
            title: __('Thank you for your purchase!'),
            mobileTitle: __('Order details'),
            url: '/success',
            render: this.renderDetailsStep.bind(this),
            areTotalsVisible: false
        }
    };

    componentDidMount() {
        this.updateHeader();
        this.updateStepURL(true);
    }

    componentDidUpdate(prevProps) {
        const { checkoutStep } = this.props;
        const { checkoutStep: prevCheckoutStep } = prevProps;

        if (checkoutStep !== prevCheckoutStep) {
            this.updateHeader();
            this.updateStep();
        }
    }

    updateHeader() {
        const { setHeaderState, checkoutStep, goBack } = this.props;
        const { mobileTitle, title } = this.stepMap[checkoutStep];

        setHeaderState({
            name: checkoutStep === DETAILS_STEP ? CHECKOUT_SUCCESS : CHECKOUT,
            title: mobileTitle || title,
            onBackClick: () => goBack()
        });
    }

    updateStepURL(isMounting = false) {
        const { checkoutStep, history, isCartLoading } = this.props;
        const { url } = this.stepMap[checkoutStep];
        const { pathname = '' } = location;

        if (!(isCartLoading && pathname.match(CHECKOUT_URL_REGEX))) {
            if (isMounting) {
                history.replace(appendWithStoreCode(`${ CHECKOUT_URL }${ url }`));
            } else {
                history.push(appendWithStoreCode(`${ CHECKOUT_URL }${ url }`));
            }
        }
    }

    updateStep() {
        this.updateStepURL();
        scrollToTop({ behavior: 'smooth' });
    }

    renderTitle() {
        const { checkoutStep, totals: { is_virtual } } = this.props;
        const { title = '', number } = this.stepMap[checkoutStep];

        if (is_virtual || !number) {
            return (
                <div block="Checkout" elem="Header">
                    <div block="Checkout" elem="Title">{ title }</div>
                </div>
            );
        }

        return (
            <div block="Checkout" elem="ProgressSection">
                <div block="Checkout" elem="Header">
                    <div block="Checkout" elem="Title">{ title }</div>
                    <div block="Checkout" elem="Step">
                        <span block="Checkout" elem="SelectedStep">{ number }</span>
                        <span block="Checkout" elem="StepsBorder">/</span>
                        <span block="Checkout" elem="TotalSteps">{ Object.keys(this.stepMap).length }</span>
                    </div>
                </div>
                <div block="Checkout" elem="StepBarTotal" />
                <div block="Checkout" elem="StepBarActive" mods={ { isSecond: number === 2 } } />
            </div>
        );
    }

    renderShippingStep() {
        const {
            shippingMethods,
            onShippingEstimationFieldsChange,
            saveAddressInformation,
            isDeliveryOptionsLoading,
            onPasswordChange,
            onCreateUserChange,
            onEmailChange,
            isCreateUser,
            estimateAddress,
            isPickInStoreMethodSelected,
            handleSelectDeliveryMethod,
            cartTotalSubPrice,
            onShippingMethodSelect,
            onStoreSelect,
            selectedStoreAddress,
            isGuestEmailSaved
        } = this.props;

        return (
            <Suspense fallback={ <Loader /> }>
                <CheckoutShipping
                  isLoading={ isDeliveryOptionsLoading }
                  shippingMethods={ shippingMethods }
                  cartTotalSubPrice={ cartTotalSubPrice }
                  saveAddressInformation={ saveAddressInformation }
                  onShippingEstimationFieldsChange={ onShippingEstimationFieldsChange }
                  onShippingMethodSelect={ onShippingMethodSelect }
                  onPasswordChange={ onPasswordChange }
                  onCreateUserChange={ onCreateUserChange }
                  onEmailChange={ onEmailChange }
                  isCreateUser={ isCreateUser }
                  estimateAddress={ estimateAddress }
                  handleSelectDeliveryMethod={ handleSelectDeliveryMethod }
                  isPickInStoreMethodSelected={ isPickInStoreMethodSelected }
                  onStoreSelect={ onStoreSelect }
                  selectedStoreAddress={ selectedStoreAddress }
                  isGuestEmailSaved={ isGuestEmailSaved }
                />
            </Suspense>
        );
    }

    renderBillingStep() {
        const {
            setLoading,
            setDetailsStep,
            shippingAddress,
            onEmailChange,
            paymentMethods = [],
            savePaymentInformation,
            selectedShippingMethod
        } = this.props;

        return (
            <Suspense fallback={ <Loader /> }>
                <CheckoutBilling
                  setLoading={ setLoading }
                  paymentMethods={ paymentMethods }
                  setDetailsStep={ setDetailsStep }
                  onEmailChange={ onEmailChange }
                  shippingAddress={ shippingAddress }
                  savePaymentInformation={ savePaymentInformation }
                  selectedShippingMethod={ selectedShippingMethod }
                />
            </Suspense>
        );
    }

    renderDetailsStep() {
        const {
            orderID,
            isEmailAvailable,
            email,
            billingAddress: {
                firstname,
                lastname
            }
        } = this.props;

        return (
            <Suspense fallback={ <Loader /> }>
                <CheckoutSuccess
                  email={ email }
                  firstName={ firstname }
                  lastName={ lastname }
                  isEmailAvailable={ isEmailAvailable }
                  orderID={ orderID }
                />
            </Suspense>
        );
    }

    renderDiscountCode() {
        const {
            totals: { coupon_code, items },
            checkoutStep
        } = this.props;

        if (!items || items.length < 1 || checkoutStep !== BILLING_STEP) {
            return null;
        }

        return (
            <ExpandableContent
              heading={ __('Have a discount code?') }
              mix={ { block: 'Checkout', elem: 'Discount' } }
              isArrow
            >
                <CartCoupon couponCode={ coupon_code } />
            </ExpandableContent>
        );
    }

    renderStep() {
        const { checkoutStep } = this.props;
        const { render } = this.stepMap[checkoutStep];

        if (render) {
            return render();
        }

        return null;
    }

    renderLoader() {
        const { isLoading } = this.props;

        return <Loader isLoading={ isLoading } />;
    }

    renderFullPageLoader() {
        return (
            <main block="Checkout" elem="FullPageLoader">
                <Loader isLoading />
            </main>
        );
    }

    renderSummary(showOnMobile = false) {
        const {
            checkoutTotals,
            checkoutStep,
            paymentTotals,
            isMobile,
            onCouponCodeUpdate
        } = this.props;
        const { areTotalsVisible } = this.stepMap[checkoutStep];
        const { renderPromo } = this.renderPromo(true) || {};

        if (!areTotalsVisible || (showOnMobile && !isMobile) || (!showOnMobile && isMobile)) {
            return null;
        }

        return (
            <>
                <CheckoutOrderSummary
                  checkoutStep={ checkoutStep }
                  totals={ checkoutTotals }
                  paymentTotals={ paymentTotals }
                  isExpandable={ isMobile }
                  onCouponCodeUpdate={ onCouponCodeUpdate }
                  renderCmsBlock={ renderPromo }
                  showItems
                />
                { !showOnMobile && this.renderDiscountCode() }
            </>
        );
    }

    renderPromo(showOnMobile = false) {
        const { checkoutStep, isMobile } = this.props;
        const isBilling = checkoutStep === BILLING_STEP;

        if ((!showOnMobile && isMobile) || checkoutStep === DETAILS_STEP) {
            return null;
        }

        const {
            checkout_content: {
                [isBilling ? 'checkout_billing_cms' : 'checkout_shipping_cms']: promo
            } = {}
        } = window.contentConfiguration;

        if (!promo) {
            return null;
        }

        return (
            <div block="Checkout" elem="Promo">
                <CmsBlock identifier={ promo } />
            </div>
        );
    }

    renderStoreInPickUpMethod() {
        const {
            isPickInStoreMethodSelected,
            handleSelectDeliveryMethod,
            checkoutStep,
            isInStoreActivated,
            shippingMethods,
            totals: {
                is_in_store_pickup_available: isInStorePickupAvailable
            }
        } = this.props;

        if (checkoutStep !== SHIPPING_STEP || !isInStoreActivated) {
            return null;
        }

        if (!isInStorePickupAvailable) {
            return null;
        }

        return (
            <div
              block="Checkout"
              elem="DeliverySelect"
            >
                <button
                  block="Checkout"
                  elem="ShippingButton"
                  mix={ { block: 'Button', mods: { isHollow: !isPickInStoreMethodSelected } } }
                  type="button"
                  disabled={ !isPickInStoreMethodSelected }
                  onClick={ handleSelectDeliveryMethod }
                >
                   { __('Shipping') }
                </button>
                <button
                  block="Checkout"
                  elem="PickInStore"
                  mix={ { block: 'Button', mods: { isHollow: isPickInStoreMethodSelected } } }
                  type="button"
                  disabled={ isPickInStoreMethodSelected || shippingMethods?.length < 1 }
                  onClick={ handleSelectDeliveryMethod }
                >
                    { __('Pick in Store') }
                </button>
            </div>
        );
    }

    render() {
        const { isCartLoading } = this.props;

        if (isCartLoading) {
            return this.renderFullPageLoader();
        }

        return (
            <main block="Checkout">
                <ContentWrapper
                  wrapperMix={ { block: 'Checkout', elem: 'Wrapper' } }
                  label={ __('Checkout page') }
                >
                    { this.renderSummary(true) }
                    <div>
                        <div block="Checkout" elem="Step">
                            { this.renderTitle() }
                            { this.renderStoreInPickUpMethod() }
                            { this.renderStep() }
                            { this.renderLoader() }
                        </div>
                    </div>
                    <div>
                        <Suspense fallback={ <Loader /> }>
                            { this.renderSummary() }
                            { this.renderPromo() }
                        </Suspense>
                    </div>
                </ContentWrapper>
            </main>
        );
    }
}

export default Checkout;
