import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/services/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { request } from "http";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    // const [freeTrialPeriod, setFreeTrialPeriod] = useState(0);

    // const settingsRef = doc(db, "settings", "PricingRequirement");

    // useEffect(() => {
    //   const fetchSettings = async () => {
    //     const snap = await getDoc(settingsRef);
    //     if (snap.exists()) {
    //       const data = snap.data();
    //       setFreeTrialPeriod(data.freeTrialPeriod || 0);
    //     }
    //   };
    //   fetchSettings();
    // }, []);

    const { userId, plan, price, billing, action, addonSubscriptionId } =
      await req.json();

    if (!userId || !action) throw new Error("Missing required fields");

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");

    const userData = userSnap.data() as any;

    const pricingRequirementRef = doc(db, "settings", "PricingRequirement");
    const pricingRequirementSnap = await getDoc(pricingRequirementRef);
    const pricingRequirementData = pricingRequirementSnap.data() as any;
    const freeTrialPeriod = Number(userData?.freeTrialPeriod) ?? 0;

    // Ensure Stripe customer
    let stripeCustomerId = userData.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.fullName,
      });
      stripeCustomerId = customer.id;
      await updateDoc(userRef, { stripeCustomerId });
    }

    /* With-out Trail Periond */
    if (action === "create") {
      const numericPrice = Number(price);
      if (isNaN(numericPrice)) throw new Error("Invalid price");
      const stripeUnitAmount = Math.round(numericPrice * 100);

      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date(subscriptionStartDate);
      if (billing === "annual") {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      } else {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      }

      const product = await stripe.products.create({ name: plan });
      const stripePrice = await stripe.prices.create({
        unit_amount: stripeUnitAmount,
        currency: "usd",
        recurring: { interval: billing === "annual" ? "year" : "month" },
        product: product.id,
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePrice.id }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent", "latest_invoice"],
      });

      let clientSecret: string | null = null;
      let paymentIntentId: string | null = null;

      if (subscription.latest_invoice) {
        const latestInvoice = subscription.latest_invoice as any;
        const paymentIntent = latestInvoice.payment_intent;

        if (paymentIntent) {
          clientSecret = paymentIntent.client_secret;
          paymentIntentId = paymentIntent.id;
        }
      }

      if (!clientSecret) {
        const paymentIntent = await stripe.paymentIntents.create({
          customer: stripeCustomerId,
          amount: stripeUnitAmount,
          currency: "usd",
          description: `${plan} Subscription (${billing})`,
        });
        clientSecret = paymentIntent.client_secret;
        paymentIntentId = paymentIntent.id;
      }

      let invoicePdf: string | null = null;
      let invoiceUrl: string | null = null;
      if (subscription.latest_invoice) {
        const latestInvoice = subscription.latest_invoice as any;
        invoicePdf = latestInvoice.invoice_pdf || null;
        invoiceUrl = latestInvoice.hosted_invoice_url || null;
      }

      const subsRef = collection(db, "subscriptions");
      await addDoc(subsRef, {
        userId,
        plan,
        planPrice: numericPrice,
        subscriptionId: subscription.id,
        paymentIntentId,
        status: "active",
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        stripeCustomerId,
        invoiceUrl,
        invoicePdf,
        createdAt: new Date(),
      });

      const isAddon = plan.startsWith("Add");
      const updateData: any = {};

      if (!isAddon) {
        // Main plan (Pro)
        updateData.planType = "paid";
        updateData.planName = plan;
        updateData.subscriptionId = subscription.id;
        updateData.canceledAtPeriodEnd = false;
        updateData.subscriptionStartDate = subscriptionStartDate;
        updateData.subscriptionEndDate = subscriptionEndDate;
        updateData.addons = [];
      } else {
        // Add-on plan
        const existingAddons = userData.addons || [];
        updateData.addons = [
          ...existingAddons,
          {
            name: plan,
            price: numericPrice,
            billing: billing,
            subscriptionId: subscription.id,
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            paymentIntentId,
          },
        ];
      }

      // --- ADD SUBSCRIPTION HISTORY ---
      const subscriptionData = {
        plan,
        price: numericPrice,
        billing,
        subscriptionId: subscription.id,
        paymentIntentId,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        invoiceUrl,
        invoicePdf,
        createdAt: new Date(),
      };
      const existingHistory = userData.subscriptionHistory || [];
      updateData.subscriptionHistory = [...existingHistory, subscriptionData];
      // ---------------------------------

      await updateDoc(userRef, updateData);

      return NextResponse.json({
        subscription,
        clientSecret,
        paymentIntentId,
        subscriptionId: subscription.id,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        invoiceUrl,
        invoicePdf,
      });
    }

    /* With Trail Periond */
    // if (action === "create") {
    //   const numericPrice = Number(price);
    //   if (isNaN(numericPrice)) throw new Error("Invalid price");
    //   const stripeUnitAmount = Math.round(numericPrice * 100);

    //   const trialDays = freeTrialPeriod;

    //   const createdAt = userData.createdAt?.toDate
    //     ? userData.createdAt.toDate()
    //     : new Date(userData.createdAt);
    //   const now = new Date();
    //   const diffMs = now.getTime() - createdAt.getTime();
    //   const accountAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    //   let trialEndDate: Date | null = null;
    //   if (accountAgeDays <= trialDays) {
    //     trialEndDate = new Date(
    //       now.getTime() + trialDays * 24 * 60 * 60 * 1000
    //     );
    //   } else {
    //     trialEndDate = now;
    //   }

    //   const subscriptionStartDate = trialEndDate;
    //   const subscriptionEndDate = new Date(subscriptionStartDate);
    //   if (billing === "annual")
    //     subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    //   else subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    //   // Create Stripe product & price
    //   const product = await stripe.products.create({ name: plan });
    //   const stripePrice = await stripe.prices.create({
    //     unit_amount: stripeUnitAmount,
    //     currency: "usd",
    //     recurring: { interval: billing === "annual" ? "year" : "month" },
    //     product: product.id,
    //   });

    //   const subscription = await stripe.subscriptions.create({
    //     customer: stripeCustomerId,
    //     items: [{ price: stripePrice.id }],
    //     payment_behavior: "default_incomplete",
    //     expand: ["latest_invoice.payment_intent", "latest_invoice"],
    //     trial_end:
    //       accountAgeDays <= trialDays
    //         ? Math.floor(trialEndDate.getTime() / 1000)
    //         : undefined,
    //   });

    //   let clientSecret: string | null = null;
    //   if (subscription.latest_invoice) {
    //     const latestInvoice = subscription.latest_invoice as any;
    //     clientSecret = latestInvoice.payment_intent?.client_secret || null;
    //   }
    //   if (!clientSecret) {
    //     const paymentIntent = await stripe.paymentIntents.create({
    //       customer: stripeCustomerId,
    //       amount: stripeUnitAmount,
    //       currency: "usd",
    //       description: `${plan} Subscription (${billing})`,
    //     });
    //     clientSecret = paymentIntent.client_secret;
    //   }

    //   let invoicePdf: string | null = null;
    //   let invoiceUrl: string | null = null;
    //   if (subscription.latest_invoice) {
    //     const latestInvoice = subscription.latest_invoice as any;
    //     invoicePdf = latestInvoice.invoice_pdf || null;
    //     invoiceUrl = latestInvoice.hosted_invoice_url || null;
    //   }

    //   // Save subscription in Firestore
    //   const subsRef = collection(db, "subscriptions");
    //   await addDoc(subsRef, {
    //     userId,
    //     plan,
    //     planPrice: numericPrice,
    //     subscriptionId: subscription.id,
    //     status: "active",
    //     startDate: subscriptionStartDate,
    //     endDate: subscriptionEndDate,
    //     stripeCustomerId,
    //     invoiceUrl,
    //     invoicePdf,
    //     createdAt: new Date(),
    //   });

    //   // Update user document
    //   const isAddon = plan.startsWith("Add");
    //   const updateData: any = {};

    //   if (!isAddon) {
    //     // Main plan (Pro)
    //     updateData.planType = "paid";
    //     updateData.planName = plan;
    //     updateData.subscriptionId = subscription.id;
    //     updateData.canceledAtPeriodEnd = false;
    //     updateData.subscriptionStartDate = subscriptionStartDate;
    //     updateData.subscriptionEndDate = subscriptionEndDate;
    //     updateData.addons = []; // initialize addons
    //   } else {
    //     // Add-on plan
    //     const existingAddons = userData.addons || [];
    //     updateData.addons = [
    //       ...existingAddons,
    //       { name: plan, subscriptionId: subscription.id },
    //     ];
    //   }

    //   await updateDoc(userRef, updateData);

    //   return NextResponse.json({
    //     subscription,
    //     clientSecret,
    //     subscriptionId: subscription.id,
    //     startDate: subscriptionStartDate,
    //     endDate: subscriptionEndDate,
    //     invoiceUrl,
    //     invoicePdf,
    //   });
    // }

    if (action === "cancel") {
      if (!userData.subscriptionId)
        throw new Error("No active subscription found");

      const subsToCancel = [
        { name: userData.planName, id: userData.subscriptionId },
        ...(userData.addons || []).map((addon: any) => ({
          name: addon.name,
          id: addon.subscriptionId,
        })),
      ];

      const now = new Date();
      const refunds = [];
      for (const sub of subsToCancel) {
        const subscription = await stripe.subscriptions.retrieve(sub.id, {
          expand: ["latest_invoice.payment_intent", "latest_invoice.lines"],
        });

        let startDate: Date;
        let endDate: Date;

        if (
          subscription.latest_invoice &&
          //@ts-ignore
          "lines" in subscription.latest_invoice
        ) {
          const invoiceLine = subscription.latest_invoice.lines.data[0];
          startDate = new Date(invoiceLine.period.start * 1000);
          endDate = new Date(invoiceLine.period.end * 1000);
        } else {
          //@ts-ignore
          startDate = new Date(subscription.current_period_start * 1000);
          //@ts-ignore
          endDate = new Date(subscription.current_period_end * 1000);
        }

        const daysSinceStart =
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceStart <= 30) {
          await stripe.subscriptions.update(sub.id, {
            cancel_at_period_end: true,
          });

          const changes = await stripe.charges.list({
            customer: userData.stripeCustomerId,
            limit: 3,
          });

          for (const charge of changes.data) {
            if (charge.paid && !charge.refunded) {
              const refund = await stripe.refunds.create({ charge: charge.id });
              refunds.push(refund);
            }
          }
        }
      }

      await updateDoc(userRef, {
        planType: "free",
        planName: null,
        subscriptionId: null,
        canceledAtPeriodEnd: true,
        refund: refunds,
        addons: [],
      });

      return NextResponse.json({
        message: "Pro plan and all add-ons canceled and refunded successfully.",
      });
    }

    if (action === "renew") {
      if (!userData.subscriptionId) throw new Error("No subscription to renew");

      const renewed = await stripe.subscriptions.update(
        userData.subscriptionId,
        {
          cancel_at_period_end: false,
          expand: ["latest_invoice.lines"],
        }
      );

      let startDate: Date | null = null;
      let endDate: Date | null = null;

      //@ts-ignore
      if (renewed.latest_invoice && "lines" in renewed.latest_invoice) {
        const invoiceLine = renewed.latest_invoice.lines.data[0];
        startDate = new Date(invoiceLine.period.start * 1000);
        endDate = new Date(invoiceLine.period.end * 1000);
      } else {
        //@ts-ignore
        startDate = new Date(renewed.current_period_start * 1000);
        //@ts-ignore
        endDate = new Date(renewed.current_period_end * 1000);
      }

      await updateDoc(userRef, {
        canceledAtPeriodEnd: false,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        planType: "paid",
        planName: userData.planName || plan,
      });

      return NextResponse.json({
        message: "Subscription renewed successfully! Access restored.",
        subscription: renewed,
        startDate,
        endDate,
      });
    }

    if (action === "get") {
      if (!userData.subscriptionId) {
        return NextResponse.json({
          message: "User has no subscription",
          freeTrialPeriod,
        });
      }

      const subscription: Stripe.Subscription =
        await stripe.subscriptions.retrieve(userData.subscriptionId, {
          expand: [
            "items.data.price.product",
            "latest_invoice.payment_intent",
            "latest_invoice",
            "latest_invoice.lines",
          ],
        });

      const item = subscription.items.data[0];
      const price = item.price;
      const product = price.product as Stripe.Product;

      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (
        subscription.latest_invoice &&
        //@ts-ignore
        "lines" in subscription.latest_invoice
      ) {
        const invoiceLine = subscription.latest_invoice.lines.data[0];
        startDate = new Date(invoiceLine.period.start * 1000);
        endDate = new Date(invoiceLine.period.end * 1000);
      } else if (
        //@ts-ignore
        subscription.current_period_start &&
        //@ts-ignore
        subscription.current_period_end
      ) {
        //@ts-ignore
        startDate = new Date(subscription.current_period_start * 1000);
        //@ts-ignore
        endDate = new Date(subscription.current_period_end * 1000);
      }

      let invoicePdf: string | null = null;
      let invoiceUrl: string | null = null;

      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 10,
      });

      const paidInvoice = invoices.data.find(
        (inv) => inv.status === "paid" && inv.amount_paid > 0
      );

      if (paidInvoice) {
        invoicePdf = paidInvoice.invoice_pdf || null;
        invoiceUrl = paidInvoice.hosted_invoice_url || null;
      } else {
        const fallbackInvoice = invoices.data.find((inv) => inv.invoice_pdf);
        if (fallbackInvoice) {
          invoicePdf = fallbackInvoice.invoice_pdf;
          invoiceUrl = fallbackInvoice.hosted_invoice_url;
        }
      }

      const subsRef = collection(db, "subscriptions");
      const q = query(subsRef, where("subscriptionId", "==", subscription.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const subDoc = querySnapshot.docs[0].ref;
        await updateDoc(subDoc, {
          invoicePdf,
          invoiceUrl,
        });
      }

      return NextResponse.json({
        planName: product.name,
        price: price.unit_amount ? price.unit_amount / 100 : null,
        billing: price.recurring?.interval || null,
        status: subscription.status,
        startDate,
        endDate,
        invoicePdf,
        invoiceUrl,
        subscription: subscription,
        freeTrialPeriod,
      });
    }

    if (action === "cancel-addon") {
      if (!addonSubscriptionId) {
        throw new Error("Addon subscription ID is required");
      }
      const addon = (userData.addons || []).find(
        (a: any) => a.subscriptionId === addonSubscriptionId
      );
      const subscription = await stripe.subscriptions.retrieve(
        addonSubscriptionId,
        {
          expand: ["latest_invoice"],
        }
      );

      // Cancel addon at period end
      await stripe.subscriptions.update(addonSubscriptionId, {
        cancel_at_period_end: true,
      });

      const refunds = [];
      const chargesList = await stripe.charges.list({
        customer: userData.stripeCustomerId,
        limit: 50, // increase if needed
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(
        addon.paymentIntentId
      );

      const chargeId = paymentIntent.latest_charge;
      //@ts-ignore
      const refund = await stripe.refunds.create({ charge: chargeId });
      refunds.push(refund);
      // Update Firestore
      await updateDoc(userRef, {
        addons: (userData.addons || []).filter(
          (a: any) => a.subscriptionId !== addonSubscriptionId
        ),
        addonsRefund: { ...userData.addonsRefund, ...refunds },
      });

      return NextResponse.json({
        message: "Addon canceled and refunded successfully.",
        refunds,
      });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    console.error("Subscription error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 400 }
    );
  }
}
