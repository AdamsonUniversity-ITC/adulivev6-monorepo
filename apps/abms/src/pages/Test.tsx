import { testRoute } from '../router';
import AuthorizedScreen from '../components/AuthorizedScreen';

export default function Test() {
    const { data } = testRoute.useLoaderData();
    return <AuthorizedScreen data={data} />;
}