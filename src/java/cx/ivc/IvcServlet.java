package cx.ivc;

public interface IvcServlet {
    
    /**
     * Stable name used to identify this servlet.
     */
    String name();

    /**
     * Does this servlet handle the ivc:// object?
     *
     * The default is false so implementations must explicitly opt in to
     * handling URI objects.
     */
    default boolean handles(IvcUri uri) {
        return false;
    }

    /**
     * Consume a delta from the object's data stream
     * (chat, memo, signaling, and so on).
     *
     * The default implementation ignores deltas.
     */
    default void onDelta(Delta delta) {
        // This servlet does not consume deltas.
    }

    /**
     * Full request dispatch for custom endpoints (GET/POST/PUT).
     *
     * Implementations that expose custom endpoints must override this method.
     */
    default IvcResponse service(IvcRequest request) {
        throw new UnsupportedOperationException(
            "Servlet '" + name() + "' does not support service requests"
        );
    }
}
