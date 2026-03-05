import { Balancer as BalancerComponent } from "react-wrap-balancer";

export const Balancer = (props: React.ComponentPropsWithoutRef<typeof BalancerComponent>) => {
	return <BalancerComponent {...props}>{props.children}</BalancerComponent>;
};
